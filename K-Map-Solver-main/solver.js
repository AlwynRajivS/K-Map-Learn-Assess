const Solver = {

  /* =========================================================
     BASIC HELPERS
     ========================================================= */

  isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0;
  },

  bits(minterm, variables) {
    const out = [];

    for (let i = variables - 1; i >= 0; i--) {
      out.push((minterm >> i) & 1);
    }

    return out;
  },

  /*
     Convert displayed K-Map cell index
     into the actual minterm/maxterm number.
  */
  indexToMinterm(index, state) {
    const q = KM.config(state.V);

    const r = Math.floor(index / q.C);
    const c = index % q.C;

    return KM.mt(state.V, r, c);
  },

  /*
     Convert actual minterm/maxterm number
     back to displayed K-Map cell index.
  */
  mintermToIndex(minterm, state) {
    const q = KM.config(state.V);

    for (let r = 0; r < q.R; r++) {

      for (let c = 0; c < q.C; c++) {

        if (
          KM.mt(state.V, r, c) ===
          Number(minterm)
        ) {

          return r * q.C + c;

        }

      }

    }

    return -1;
  },


  /* =========================================================
     BOOLEAN CUBE VALIDATION

     Used for 2, 3, 4 and 5 variable K-Maps.

     This automatically handles:

     ✓ Normal groups
     ✓ Horizontal wrapping
     ✓ Vertical wrapping
     ✓ Four-corner wrapping
     ✓ 5-variable cross-layer groups
     ✓ Cross-layer + wrapping
     ✓ Groups of 1, 2, 4, 8, 16, 32
     ========================================================= */

  validCube(minterms, variables) {

    const ids = [
      ...new Set(
        minterms.map(Number)
      )
    ].sort((a, b) => a - b);


    if (!ids.length) {
      return false;
    }


    if (!this.isPowerOfTwo(ids.length)) {
      return false;
    }


    if (
      ids.length >
      Math.pow(2, variables)
    ) {
      return false;
    }


    const binaryRows =
      ids.map(
        m =>
          this.bits(
            m,
            variables
          )
      );


    /*
       Find constant variables.
    */

    const fixed = [];


    for (
      let variable = 0;
      variable < variables;
      variable++
    ) {

      const first =
        binaryRows[0][variable];


      if (
        binaryRows.every(
          row =>
            row[variable] === first
        )
      ) {

        fixed.push({
          index: variable,
          value: first
        });

      }

    }


    /*
       Remaining variables are free.

       If there are K free variables,
       group size must be 2^K.
    */

    const freeVariables =
      variables -
      fixed.length;


    const expectedSize =
      Math.pow(
        2,
        freeVariables
      );


    if (
      ids.length !==
      expectedSize
    ) {
      return false;
    }


    /*
       Generate complete Boolean cube
       represented by fixed variables.
    */

    const expected = [];

    const total =
      Math.pow(
        2,
        variables
      );


    for (
      let m = 0;
      m < total;
      m++
    ) {

      const b =
        this.bits(
          m,
          variables
        );


      const matches =
        fixed.every(
          f =>
            b[f.index] ===
            f.value
        );


      if (matches) {

        expected.push(
          m
        );

      }

    }


    expected.sort(
      (a, b) =>
        a - b
    );


    return (
      ids.length ===
        expected.length &&

      ids.every(
        (m, i) =>
          m ===
          expected[i]
      )
    );
  },


  /* =========================================================
     MAIN GROUP VALIDATION

     SOP:
       Groups 1 and X

     POS:
       Groups 0 and X
     ========================================================= */

  valid(ids, state) {

    if (
      !Array.isArray(ids) ||
      !ids.length
    ) {
      return false;
    }


    const uniqueIds = [
      ...new Set(ids)
    ];


    /*
       Duplicate cells are invalid.
    */

    if (
      uniqueIds.length !==
      ids.length
    ) {
      return false;
    }


    const n =
      uniqueIds.length;


    /*
       Group must have power-of-two size.
    */

    if (
      !this.isPowerOfTwo(n)
    ) {
      return false;
    }


    /*
       Maximum group size depends
       on number of variables.
    */

    if (
      n >
      Math.pow(
        2,
        state.V
      )
    ) {
      return false;
    }


    /*
       SOP → target 1
       POS → target 0
    */

    const target =
      state.form === "SOP"
        ? 1
        : 0;


    /*
       Check every selected cell.

       SOP:
       1 and X allowed.

       POS:
       0 and X allowed.
    */

    if (
      uniqueIds.some(
        i =>
          state.vals[i] !== target &&
          state.vals[i] !== "X"
      )
    ) {
      return false;
    }


    /*
       Don't Care only group is invalid.

       A group must cover at least
       one actual 1 for SOP
       or one actual 0 for POS.
    */

    if (
      uniqueIds.every(
        i =>
          state.vals[i] === "X"
      )
    ) {
      return false;
    }


    /*
       Convert displayed indexes
       into actual minterm/maxterm numbers.
    */

    const minterms =
      uniqueIds.map(
        i =>
          this.indexToMinterm(
            i,
            state
          )
      );


    /*
       Validate Boolean cube.

       Same logic works for
       SOP and POS.
    */

    return this.validCube(
      minterms,
      state.V
    );
  },


  /* =========================================================
     GENERATE ALL VALID K-MAP GROUPS

     Each variable has 3 possible states:

       0 → Fixed at 0
       1 → Fixed at 1
       2 → Free / changing

     Therefore:

     2-variable → 3² = 9 cube patterns
     3-variable → 3³ = 27
     4-variable → 3⁴ = 81
     5-variable → 3⁵ = 243

     Very efficient for K-Maps.
     ========================================================= */

  all(state) {

    const variables =
      state.V;


    const result = [];

    const seen =
      new Set();


    const totalPatterns =
      Math.pow(
        3,
        variables
      );


    const totalMinterms =
      Math.pow(
        2,
        variables
      );


    for (
      let patternNumber = 0;
      patternNumber <
      totalPatterns;
      patternNumber++
    ) {

      let value =
        patternNumber;


      const pattern = [];


      /*
         Decode ternary pattern.

         0 = fixed zero
         1 = fixed one
         2 = free
      */

      for (
        let v = 0;
        v < variables;
        v++
      ) {

        pattern.push(
          value % 3
        );


        value =
          Math.floor(
            value / 3
          );

      }


      /*
         Generate all minterms
         belonging to this cube.
      */

      const minterms = [];


      for (
        let m = 0;
        m <
        totalMinterms;
        m++
      ) {

        const binary =
          this.bits(
            m,
            variables
          );


        let matches =
          true;


        for (
          let v = 0;
          v <
          variables;
          v++
        ) {

          if (
            pattern[v] !== 2 &&
            binary[v] !==
              pattern[v]
          ) {

            matches =
              false;

            break;

          }

        }


        if (matches) {

          minterms.push(
            m
          );

        }

      }


      /*
         Convert minterms to
         displayed K-Map indexes.
      */

      const ids = [];


      for (
        const m of minterms
      ) {

        const index =
          this.mintermToIndex(
            m,
            state
          );


        if (
          index >= 0
        ) {

          ids.push(
            index
          );

        }

      }


      ids.sort(
        (a, b) =>
          a - b
      );


      const key =
        ids.join(",");


      /*
         Keep only valid SOP/POS groups.
      */

      if (
        ids.length &&
        !seen.has(key) &&
        this.valid(
          ids,
          state
        )
      ) {

        seen.add(
          key
        );


        result.push(
          ids
        );

      }

    }


    return result;
  },


  /* =========================================================
     MAXIMAL GROUP CHECK

     Rejects smaller group if
     a larger valid group contains it.

     Example:

     If valid octet exists,
     selecting only a quad is rejected.
     ========================================================= */

  maximal(ids, state) {

    const groups =
      this.all(
        state
      );


    return !groups.some(
      group =>

        group.length >
          ids.length &&

        ids.every(
          cell =>
            group.includes(
              cell
            )
        )

    );
  },


  /* =========================================================
     FIND CONSTANT VARIABLES
     ========================================================= */

  fixedVariables(ids, state) {

    const names =
      ["A", "B", "C", "D", "E"]
        .slice(
          0,
          state.V
        );


    const rows =
      ids.map(
        index => {

          const minterm =
            this.indexToMinterm(
              index,
              state
            );


          return this.bits(
            minterm,
            state.V
          );

        }
      );


    const fixed = [];


    for (
      let variable = 0;
      variable <
      state.V;
      variable++
    ) {

      const value =
        rows[0][variable];


      if (
        rows.every(
          row =>
            row[variable] ===
            value
        )
      ) {

        fixed.push({

          name:
            names[variable],

          value:
            value

        });

      }

    }


    return fixed;
  },


  /* =========================================================
     GENERATE GROUP EXPRESSION

     SOP:
       Fixed 0 → Complemented
       Fixed 1 → Normal

     POS:
       Fixed 0 → Normal
       Fixed 1 → Complemented
     ========================================================= */

  term(ids, state) {

    const fixed =
      this.fixedVariables(
        ids,
        state
      );


    /* ==========================
       SOP TERM
       ========================== */

    if (
      state.form === "SOP"
    ) {


      /*
         Full K-Map group.

         All variables eliminated.
      */

      if (
        !fixed.length
      ) {

        return "1";

      }


      return fixed

        .map(
          item =>

            item.value === 1

              ? item.name

              : item.name + "'"
        )

        .join("");

    }


    /* ==========================
       POS TERM
       ========================== */


    /*
       Full K-Map zero group.

       Function is always zero.
    */

    if (
      !fixed.length
    ) {

      return "0";

    }


    return (

      "(" +

      fixed

        .map(
          item =>

            item.value === 1

              ? item.name + "'"

              : item.name
        )

        .join(" + ")

      + ")"

    );
  },


  /* =========================================================
     GET REQUIRED CELLS

     SOP:
       Required cells = 1

     POS:
       Required cells = 0

     Don't Care cells are optional.
     ========================================================= */

  required(state) {

    const target =
      state.form === "SOP"
        ? 1
        : 0;


    return state.vals

      .map(
        (value, index) =>

          value === target

            ? index

            : -1
      )

      .filter(
        index =>
          index >= 0
      );
  },


  /* =========================================================
     GET MAXIMAL GROUPS
     ========================================================= */

  maximalGroups(state) {

    const groups =
      this.all(
        state
      );


    return groups.filter(
      group =>

        !groups.some(
          other =>

            other.length >
              group.length &&

            group.every(
              cell =>
                other.includes(
                  cell
                )
            )

        )

    );
  },


  /* =========================================================
     MINIMUM NUMBER OF GROUPS

     Finds minimum number of groups
     required to cover all mandatory cells.

     Works for:
       SOP
       POS
       Don't Care
       2V
       3V
       4V
       5V
     ========================================================= */

  minimumCount(state) {

    const required =
      this.required(
        state
      );


    /*
       No required cells.
    */

    if (
      !required.length
    ) {

      return 0;

    }


    /*
       Get only maximal valid groups.
    */

    const groups =
      this.maximalGroups(
        state
      );


    if (
      !groups.length
    ) {

      return null;

    }


    const requiredSet =
      new Set(
        required
      );


    /*
       Calculate which mandatory cells
       each group covers.
    */

    const coverage =
      groups.map(
        group =>

          group.filter(
            cell =>
              requiredSet.has(
                cell
              )
          )
      );


    /*
       Find candidate groups
       for each required cell.
    */

    const cellGroups =
      new Map();


    required.forEach(
      cell => {

        cellGroups.set(
          cell,
          []
        );

      }
    );


    coverage.forEach(
      (cells, groupIndex) => {

        cells.forEach(
          cell => {

            cellGroups
              .get(cell)
              .push(
                groupIndex
              );

          }
        );

      }
    );


    /*
       If a required cell has
       no possible group,
       solution is impossible.
    */

    for (
      const cell of required
    ) {

      if (
        !cellGroups
          .get(cell)
          .length
      ) {

        return null;

      }

    }


    let best =
      Infinity;


    /*
       Recursive minimum-cover search.
    */

    const search =
      (
        covered,
        used
      ) => {


        /*
           Stop searching if current
           solution is already worse.
        */

        if (
          used >= best
        ) {

          return;

        }


        /*
           Find uncovered required cell
           having fewest group choices.
        */

        let nextCell =
          null;


        let options =
          null;


        for (
          const cell of required
        ) {

          if (
            covered.has(
              cell
            )
          ) {

            continue;

          }


          const possible =
            cellGroups.get(
              cell
            );


          if (
            options === null ||
            possible.length <
              options.length
          ) {

            nextCell =
              cell;


            options =
              possible;

          }

        }


        /*
           All required cells covered.
        */

        if (
          nextCell === null
        ) {

          best =
            Math.min(
              best,
              used
            );


          return;

        }


        /*
           Try candidate groups.
        */

        for (
          const groupIndex
          of options
        ) {

          const nextCovered =
            new Set(
              covered
            );


          coverage[
            groupIndex
          ].forEach(
            cell => {

              nextCovered.add(
                cell
              );

            }
          );


          search(
            nextCovered,
            used + 1
          );

        }

      };


    search(
      new Set(),
      0
    );


    return best ===
      Infinity

      ? null

      : best;
  }

};