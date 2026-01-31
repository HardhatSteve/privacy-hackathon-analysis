fn main(
    // The User's Secret Location (Private)
    my_lat: Field,
    my_long: Field,

    // The Target Zone (Public - e.g. Avondale)
    target_lat: pub Field,
    target_long: pub Field,
    radius_sq: pub Field
) {
    // 1. Calculate the difference (User - Target)
    // We use a safe subtraction method since these are Fields
    let diff_lat = my_lat - target_lat;
    let diff_long = my_long - target_long;

    // 2. Calculate Distance Squared (a^2 + b^2 = c^2)
    let dist = (diff_lat * diff_lat) + (diff_long * diff_long);

    // 3. The "Geofence" Check
    // Assert that calculated distance is LESS than the allowed radius
    assert(dist as u64 < radius_sq as u64);
}
