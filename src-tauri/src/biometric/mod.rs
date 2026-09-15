pub mod baseline;
pub mod cmf_protocol;
pub mod filters;
pub mod state_machine;

pub use baseline::PersonalBaseline;
pub use cmf_protocol::{CmfBiometricFrame, CmfPacketType, CmfProtocolDecoder};
pub use filters::BiometricFilter;
pub use state_machine::{InferredState, StateClassifier};
