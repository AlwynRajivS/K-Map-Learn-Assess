const Solver = {

  /* =========================================================
     CHECK CYCLIC / WRAPPING INTERVAL
     Used for 2V, 3V and 4V K-Maps
     ========================================================= */
  cyclic(a, n) {
    if (a.length === n) return true;

    return KM.intervals(n).some(x =>
      x.length === a.length &&
      a.every(y => x.includes(y))
    );
  },


  /* =========================================================
     CONVERT DISPLAY CELL INDEX TO ACTUAL MINTERM
     ========================================================= */
  indexToMinterm(index, state) {
    const q = KM.config(state.V);

    const r = Math.floor(index / q.C);
    const c = index % q.C;

    return KM.mt(state.V, r, c);
  },


  /* =========================================================
     CONVERT MINTERM TO BINARY BITS
     
     Example for 5 Variables:
     
     m0  = 00000
     m2  = 00010
     m4  = 00100
     m6  = 00110
     m16 = 10000
     
     ========================================================= */
  bits(minterm, variables) {

    const result = [];

    for (let i = variables - 1; i >= 0; i--) {
      result.push(
        (minterm >> i) & 1
      );
    }

    return result;
  },


  /* =========================================================
     5-VARIABLE K-MAP GROUP VALIDATION
     
     A valid group must represent a Boolean cube.
     
     Example:
     
     m0, m2, m4, m6,
     m16, m18, m20, m22
     
     Binary:
     
     00000
     00010
     00100
     00110
     10000
     10010
     10100
     10110
     
     Constants:
     
     B = 0
     E = 0
     
     Therefore:
     
     B'E'
     
     Group Size = 8
     ========================================================= */
  validCube5(minterms) {

    const ids = [
      ...new Set(
        minterms.map(Number)
      )
    ];

    // Valid group sizes
    if (
      ![1, 2, 4, 8, 16, 32]
        .includes(ids.length)
    ) {
      return false;
    }

    // Convert all minterms into A B C D E bits
    const rows = ids.map(
      m => this.bits(m, 5)
    );

    // Find constant variables
    const fixed = [];

    for (let v = 0; v < 5; v++) {

      const values = new Set(
        rows.map(r => r[v])
      );

      // Variable is constant
      if (values.size === 1) {

        fixed.push({
          index: v,
          value: rows[0][v]
        });

      }
    }

    // Variables that are changing
    const freeCount =
      5 - fixed.length;

    // Complete Boolean cube must contain
    // exactly 2^(number of changing variables)
    if (
      ids.length !==
      Math.pow(2, freeCount)
    ) {
      return false;
    }

    /*
       Generate every minterm that satisfies
       the constant-variable conditions.

       This ensures the selected cells form
       one complete Boolean cube.
    */

    const expected = [];

    for (let m = 0; m < 32; m++) {

      const b = this.bits(m, 5);

      const match = fixed.every(
        f => b[f.index] === f.value
      );

      if (match) {
        expected.push(m);
      }
    }

    const selected =
      ids.slice().sort(
        (a, b) => a - b
      );

    expected.sort(
      (a, b) => a - b
    );

    // Selected minterms must exactly
    // match the complete cube
    return (
      selected.length ===
        expected.length &&

      selected.every(
        (x, i) =>
          x === expected[i]
      )
    );
  },


  /* =========================================================
     MAIN GROUP VALIDATION
     ========================================================= */
  valid(ids, state) {

    const q = KM.config(state.V);

    const n = ids.length;

    const target =
      state.form === "SOP"
        ? 1
        : 0;


    // -----------------------------------------
    // Group cannot be empty
    // -----------------------------------------

    if (!n) {
      return false;
    }


    // -----------------------------------------
    // Group size must be power of 2
    // 1, 2, 4, 8, 16, 32
    // -----------------------------------------

    if (n & (n - 1)) {
      return false;
    }


    // -----------------------------------------
    // Check cell values
    //
    // SOP → 1 or X
    // POS → 0 or X
    // -----------------------------------------

    if (
      ids.some(
        i =>
          state.vals[i] !== target &&
          state.vals[i] !== "X"
      )
    ) {
      return false;
    }


    // -----------------------------------------
    // Group cannot contain only Don't Cares
    // -----------------------------------------

    if (
      ids.every(
        i =>
          state.vals[i] === "X"
      )
    ) {
      return false;
    }


    /* =====================================================
       SPECIAL 5-VARIABLE VALIDATION
       ===================================================== */

    if (state.V === 5) {

      // Convert display indexes
      // to actual minterms

      const minterms =
        ids.map(
          i =>
            this.indexToMinterm(
              i,
              state
            )
        );

      return this.validCube5(
        minterms
      );
    }


    /* =====================================================
       EXISTING 2V / 3V / 4V VALIDATION
       ===================================================== */

    const rs = [
      ...new Set(
        ids.map(
          i =>
            Math.floor(
              i / q.C
            )
        )
      )
    ];


    const cs = [
      ...new Set(
        ids.map(
          i =>
            i % q.C
        )
      )
    ];


    // Selected cells must form rectangle

    if (
      rs.length *
        cs.length !==
      n
    ) {
      return false;
    }


    // Check row wrapping

    if (
      !this.cyclic(
        rs,
        q.R
      )
    ) {
      return false;
    }


    // Check column wrapping

    if (
      !this.cyclic(
        cs,
        q.C
      )
    ) {
      return false;
    }


    // Every cell inside rectangle
    // must be selected

    return rs.every(
      r =>
        cs.every(
          c =>
            ids.includes(
              r * q.C + c
            )
        )
    );
  },


  /* =========================================================
     GENERATE ALL POSSIBLE VALID GROUPS
     ========================================================= */
  all(state) {

    const q =
      KM.config(state.V);

    const out = [];

    const seen =
      new Set();


    /* =====================================================
       SPECIAL 5-VARIABLE GROUP GENERATION
       
       Generate Boolean cubes based on fixed/free variables.
       This includes groups crossing the two displayed layers.
       ===================================================== */

    if (state.V === 5) {

      /*
         Each variable can be:

         -1 = changing/free
          0 = fixed at 0
          1 = fixed at 1

         3^5 = 243 possible cube patterns.
      */

      const patterns =
        Math.pow(3, 5);

      for (
        let pattern = 0;
        pattern < patterns;
        pattern++
      ) {

        let x = pattern;

        const condition = [];

        for (
          let v = 0;
          v < 5;
          v++
        ) {

          condition.push(
            x % 3
          );

          x =
            Math.floor(
              x / 3
            );
        }


        const minterms = [];

        for (
          let m = 0;
          m < 32;
          m++
        ) {

          const b =
            this.bits(
              m,
              5
            );

          let match = true;

          for (
            let v = 0;
            v < 5;
            v++
          ) {

            /*
               condition:

               0 → fixed 0
               1 → fixed 1
               2 → free
            */

            if (
              condition[v] !== 2 &&
              b[v] !==
                condition[v]
            ) {

              match = false;

              break;
            }
          }

          if (match) {
            minterms.push(m);
          }
        }


        // Convert minterms back
        // into displayed cell indexes

        const ids = [];

        for (
          let i = 0;
          i <
          q.R * q.C;
          i++
        ) {

          const m =
            this.indexToMinterm(
              i,
              state
            );

          if (
            minterms.includes(m)
          ) {
            ids.push(i);
          }
        }


        ids.sort(
          (a, b) => a - b
        );


        const key =
          ids.join(",");


        if (
          ids.length &&
          !seen.has(key) &&
          this.valid(
            ids,
            state
          )
        ) {

          seen.add(key);

          out.push(ids);

        }
      }


      return out;
    }


    /* =====================================================
       2V / 3V / 4V
       Existing rectangle generation
       ===================================================== */

    KM.intervals(
      q.R
    ).forEach(
      rs =>

        KM.intervals(
          q.C
        ).forEach(
          cs => {

            const ids = [];

            rs.forEach(
              r =>

                cs.forEach(
                  c =>

                    ids.push(
                      r *
                      q.C +
                      c
                    )

                )

            );


            ids.sort(
              (a, b) =>
                a - b
            );


            const key =
              ids.join();


            if (
              !seen.has(key) &&
              this.valid(
                ids,
                state
              )
            ) {

              seen.add(key);

              out.push(ids);

            }

          }
        )

    );


    return out;
  },


  /* =========================================================
     CHECK WHETHER SELECTED GROUP IS MAXIMAL
     ========================================================= */
  maximal(ids, state) {

    return !this
      .all(state)
      .some(
        g =>

          g.length >
            ids.length &&

          ids.every(
            i =>
              g.includes(i)
          )

      );
  },


  /* =========================================================
     GENERATE BOOLEAN TERM FOR GROUP
     ========================================================= */
  term(ids, state) {

    const q =
      KM.config(state.V);


    /* =====================================================
       SPECIAL 5-VARIABLE TERM GENERATION
       ===================================================== */

    if (
      state.V === 5
    ) {

      const names =
        [
          "A",
          "B",
          "C",
          "D",
          "E"
        ];


      const arr =
        ids.map(
          i => {

            const m =
              this.indexToMinterm(
                i,
                state
              );

            return this.bits(
              m,
              5
            );

          }
        );


      const fixed = [];


      for (
        let j = 0;
        j < 5;
        j++
      ) {

        const value =
          arr[0][j];


        if (
          arr.every(
            a =>
              a[j] ===
              value
          )
        ) {

          fixed.push(
            [
              names[j],
              value
            ]
          );

        }
      }


      // SOP term

      if (
        state.form ===
        "SOP"
      ) {

        return fixed.length

          ? fixed
              .map(
                z =>
                  z[1]
                    ? z[0]
                    : z[0] + "'"
              )
              .join("")

          : "1";
      }


      // POS term

      return fixed.length

        ? "(" +

          fixed
            .map(
              z =>
                z[1]
                  ? z[0] + "'"
                  : z[0]
            )
            .join(" + ")

          + ")"

        : "0";
    }


    /* =====================================================
       EXISTING 2V / 3V / 4V TERM GENERATION
       ===================================================== */

    const names =
      q.rv.concat(
        q.cv
      );


    const arr =
      ids.map(
        i => {

          const r =
            Math.floor(
              i / q.C
            );

          const c =
            i %
            q.C;

          return (
            q.rl[r] +
            q.cl[c]
          )
            .split("")
            .map(Number);

        }
      );


    const fix = [];


    for (
      let j = 0;
      j <
      state.V;
      j++
    ) {

      const x =
        arr[0][j];


      if (
        arr.every(
          a =>
            a[j] === x
        )
      ) {

        fix.push(
          [
            names[j],
            x
          ]
        );

      }
    }


    // SOP

    if (
      state.form ===
      "SOP"
    ) {

      return fix.length

        ? fix
            .map(
              z =>
                z[1]
                  ? z[0]
                  : z[0] + "'"
            )
            .join("")

        : "1";

    }


    // POS

    return fix.length

      ? "(" +

        fix
          .map(
            z =>
              z[1]
                ? z[0] + "'"
                : z[0]
          )
          .join(" + ")

        + ")"

      : "0";
  },


  /* =========================================================
     GET REQUIRED CELLS
     ========================================================= */
  required(state) {

    const target =
      state.form ===
      "SOP"
        ? 1
        : 0;


    return state.vals

      .map(
        (v, i) =>
          v === target
            ? i
            : -1
      )

      .filter(
        i =>
          i >= 0
      );
  },


  /* =========================================================
     CALCULATE MINIMUM NUMBER OF GROUPS
     ========================================================= */
  minimumCount(state) {

    const req =
      this.required(
        state
      );


    const candidates =
      this
        .all(state)
        .filter(
          g =>
            this.maximal(
              g,
              state
            )
        );


    if (
      !req.length
    ) {
      return 0;
    }


    /*
       Avoid exponential search
       if too many candidate groups exist.
    */

    if (
      candidates.length >
      20
    ) {
      return null;
    }


    let best =
      Infinity;


    for (
      let mask = 1;
      mask <
      (1 << candidates.length);
      mask++
    ) {

      const covered =
        new Set();

      let groupCount =
        0;


      for (
        let i = 0;
        i <
        candidates.length;
        i++
      ) {

        if (
          mask &
          (1 << i)
        ) {

          groupCount++;


          candidates[i]
            .forEach(
              cell => {

                if (
                  state.vals[cell] !==
                  "X"
                ) {

                  covered.add(
                    cell
                  );

                }

              }
            );

        }
      }


      if (
        groupCount <
          best &&

        req.every(
          cell =>
            covered.has(
              cell
            )
        )
      ) {

        best =
          groupCount;

      }
    }


    return best === Infinity
      ? null
      : best;
  }

};