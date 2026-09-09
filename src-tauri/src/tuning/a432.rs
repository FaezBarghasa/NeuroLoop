use serde::{Deserialize, Serialize};

pub const CARRIER_108: f32 = 108.0;
pub const CARRIER_144: f32 = 144.0;
pub const CARRIER_216: f32 = 216.0;
pub const CARRIER_324: f32 = 324.0;
pub const CARRIER_432: f32 = 432.0;

pub const CARRIER_LADDER: [f32; 5] = [
    CARRIER_108,
    CARRIER_144,
    CARRIER_216,
    CARRIER_324,
    CARRIER_432,
];

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PresetCategory {
    Sleep,
    Focus,
    Energy,
    Relaxation,
    Meditation,
    Custom,
}

pub fn get_recommended_carrier(category: PresetCategory) -> f32 {
    match category {
        PresetCategory::Sleep => CARRIER_108,
        PresetCategory::Relaxation | PresetCategory::Meditation => CARRIER_216,
        PresetCategory::Focus | PresetCategory::Energy => CARRIER_324,
        PresetCategory::Custom => CARRIER_432,
    }
}

pub fn snap_to_a432_ladder(frequency: f32) -> f32 {
    let mut closest = CARRIER_LADDER[0];
    let mut min_diff = (frequency - closest).abs();

    for &carrier in &CARRIER_LADDER[1..] {
        let diff = (frequency - carrier).abs();
        if diff < min_diff {
            min_diff = diff;
            closest = carrier;
        }
    }

    closest
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_snap_to_a432_ladder() {
        assert_eq!(snap_to_a432_ladder(100.0), CARRIER_108);
        assert_eq!(snap_to_a432_ladder(200.0), CARRIER_216);
        assert_eq!(snap_to_a432_ladder(300.0), CARRIER_324);
        assert_eq!(snap_to_a432_ladder(440.0), CARRIER_432);
    }
}
