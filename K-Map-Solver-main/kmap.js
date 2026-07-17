const KM = {

  config(V) {

    if (V === 2) {
      return {
        R: 2,
        C: 2,

        rv: ["A"],
        cv: ["B"],

        rl: [
          "0",
          "1"
        ],

        cl: [
          "0",
          "1"
        ]
      };
    }


    if (V === 3) {
      return {
        R: 2,
        C: 4,

        rv: ["A"],
        cv: ["B", "C"],

        rl: [
          "0",
          "1"
        ],

        cl: [
          "00",
          "01",
          "11",
          "10"
        ]
      };
    }


    if (V === 4) {
      return {
        R: 4,
        C: 4,

        rv: ["A", "B"],
        cv: ["C", "D"],

        rl: [
          "00",
          "01",
          "11",
          "10"
        ],

        cl: [
          "00",
          "01",
          "11",
          "10"
        ]
      };
    }


    /* =============================================
       5-VARIABLE K-MAP

              CDE
         000 001 011 010 110 111 101 100

     AB

     00   0   1   3   2   6   7   5   4
     01   8   9  11  10  14  15  13  12
     11  24  25  27  26  30  31  29  28
     10  16  17  19  18  22  23  21  20

       ============================================= */

    if (V === 5) {
      return {
        R: 4,
        C: 8,

        rv: [
          "A",
          "B"
        ],

        cv: [
          "C",
          "D",
          "E"
        ],

        rl: [
          "00",
          "01",
          "11",
          "10"
        ],

        cl: [
          "000",
          "001",
          "011",
          "010",
          "110",
          "111",
          "101",
          "100"
        ]
      };
    }

  },


  /* =============================================
     GET MINTERM NUMBER
     ============================================= */

  mt(V, r, c) {

    const q =
      this.config(V);

    /*
       Combine row Gray code
       and column Gray code.

       Example 5-variable:

       Row AB = 11
       Column CDE = 110

       Binary = 11110
       Decimal = 30
    */

    return parseInt(
      q.rl[r] +
      q.cl[c],
      2
    );
  },


  /* =============================================
     GENERATE CYCLIC INTERVALS

     Used for K-map wrapping.

     Supports:
     Left ↔ Right
     Top ↔ Bottom
     Corner wrapping
     ============================================= */

  intervals(n) {

    const result = [];

    const sizes = [];

    for (
      let size = 1;
      size <= n;
      size *= 2
    ) {
      sizes.push(size);
    }


    sizes.forEach(
      size => {

        for (
          let start = 0;
          start < n;
          start++
        ) {

          const group = [];

          for (
            let i = 0;
            i < size;
            i++
          ) {

            group.push(
              (start + i) % n
            );

          }


          const unique = [
            ...new Set(group)
          ];


          if (
            unique.length === size
          ) {

            unique.sort(
              (a, b) =>
                a - b
            );


            const key =
              unique.join(",");


            if (
              !result.some(
                x =>
                  x.join(",") ===
                  key
              )
            ) {

              result.push(
                unique
              );

            }

          }

        }

      }
    );


    return result;
  }

};
