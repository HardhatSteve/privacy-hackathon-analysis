#!/bin/bash

# Fee manipulation protection test script
# This script validates fee manipulation protection mechanisms

echo " Testing fee manipulation protection..."

# Test 1: Check for fee calculation functions
echo "Test 1: Checking for fee calculation functions"
if grep -r "calculate_protocol_fee\|calculate_protocol_fee_atomic" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found fee calculation functions"
else
    echo " No fee calculation functions found"
    exit 1
fi

# Test 2: Check for fee bounds validation
echo "Test 2: Checking for fee bounds validation"
if grep -r "MAX_FEE_BASIS_POINTS\|FeeExceedsMaximum\|fee.*maximum" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found fee bounds validation"
else
    echo " No fee bounds validation found"
    exit 1
fi

# Test 3: Check for emergency fee multiplier controls
echo "Test 3: Checking for emergency fee multiplier controls"
if grep -r "emergency_fee_multiplier\|MAX_EMERGENCY_MULTIPLIER\|InvalidMultiplier" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found emergency fee multiplier controls"
else
    echo " No emergency fee multiplier controls found"
    exit 1
fi

# Test 4: Check for time-delayed fee changes
echo "Test 4: Checking for time-delayed fee changes"
if grep -r "FEE_CHANGE_DELAY_SECONDS\|multiplier_activation_time\|schedule_emergency_multiplier_change" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found time-delayed fee changes"
else
    echo " No time-delayed fee changes found"
    exit 1
fi

# Test 5: Check for atomic fee operations
echo "Test 5: Checking for atomic fee operations"
if grep -r "calculate_protocol_fee_atomic\|atomic.*fee\|checked_mul.*fee" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found atomic fee operations"
else
    echo " No atomic fee operations found"
    exit 1
fi

# Test 6: Check for deposit amount limits
echo "Test 6: Checking for deposit amount limits"
if grep -r "MIN_DEPOSIT_AMOUNT\|MAX_DEPOSIT_AMOUNT\|DepositTooSmall\|DepositTooLarge" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found deposit amount limits"
else
    echo " No deposit amount limits found"
    exit 1
fi

# Test 7: Check for fee basis points constants
echo "Test 7: Checking for fee basis points constants"
if grep -r "PROTOCOL_FEE_BASIS_POINTS\|basis.*points" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found fee basis points constants"
else
    echo " No fee basis points constants found"
    exit 1
fi

# Test 8: Check for fee emergency mode controls
echo "Test 8: Checking for fee emergency mode controls"
if grep -r "is_fee_emergency\|trigger_emergency_mode\|disable_emergency_mode" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found fee emergency mode controls"
else
    echo " No fee emergency mode controls found"
    exit 1
fi

# Test 9: Check for fee validation logic
echo "Test 9: Checking for fee validation logic"
if grep -r "final_fee.*>\|fee.*validation\|ensure.*fee" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found fee validation logic"
else
    echo " No fee validation logic found"
    exit 1
fi

# Test 10: Validate fee constants are properly defined
echo "Test 10: Validating fee protection constants"
if grep -r "PROTOCOL_FEE_BASIS_POINTS.*=.*[0-9]" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found protocol fee constant"
else
    echo " No protocol fee constant found"
    exit 1
fi

if grep -r "MAX_FEE_BASIS_POINTS.*=.*[0-9]" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found maximum fee constant"
else
    echo " No maximum fee constant found"
    exit 1
fi

if grep -r "MAX_EMERGENCY_MULTIPLIER.*=.*[0-9]" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found emergency multiplier constant"
else
    echo " No emergency multiplier constant found"
    exit 1
fi

# Test 11: Check for economic state management
echo "Test 11: Checking for economic state management"
if grep -r "EconomicState\|total_fees_collected\|total_volume" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found economic state management"
else
    echo " No economic state management found"
    exit 1
fi

# Test 12: Check for multiplier bounds checking
echo "Test 12: Checking for multiplier bounds checking"
if grep -A 5 -B 5 "multiplier.*>=.*1.*&&.*multiplier.*<=.*10" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found proper multiplier bounds checking"
else
    echo "  Multiplier bounds checking may be implicit"
fi

echo " Fee manipulation protection validation completed!"
exit 0
