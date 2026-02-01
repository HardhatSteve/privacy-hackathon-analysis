pragma circom 2.0.0;

// =============================================================================
// AssertBool
// =============================================================================
// Constrains a signal to be boolean (0 or 1).
//
// The constraint x * (x - 1) === 0 is satisfied only when x ∈ {0, 1}
// because the only roots of the polynomial x² - x = 0 are x = 0 and x = 1.
//
// Proof:
//   x² - x = 0
//   x(x - 1) = 0
//   x = 0 or x = 1
//
// Constraints: 1
//
template AssertBool() {
    signal input in;
    in * (in - 1) === 0;
}
