use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum CmfPacketType {
    HeartRate,
    Spo2,
    Stress,
    StepCount,
    SleepRecord,
    Battery,
    Unknown(u8),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CmfBiometricFrame {
    pub packet_type: CmfPacketType,
    pub timestamp_sec: u32,
    pub heart_rate: Option<f32>,
    pub spo2: Option<f32>,
    pub stress: Option<f32>,
    pub steps: Option<u32>,
    pub raw_payload_len: usize,
}

pub struct CmfProtocolDecoder;

impl CmfProtocolDecoder {
    pub const HEADER_BYTE: u8 = 0xAB;

    /// Decodes a raw BLE frame from CMF Watch Pro 2 telemetry stream
    /// Protocol frame format:
    /// [0]       = 0xAB (Magic sync byte)
    /// [1]       = OpCode / Packet Type (0x01=HR, 0x02=SpO2, 0x03=Stress, 0x04=Steps, 0x05=Sleep)
    /// [2..3]    = Payload length (u16 LE)
    /// [4..7]    = Timestamp in epoch seconds (u32 LE)
    /// [8..N-2]  = Payload bytes
    /// [N-2..N]  = CRC16 checksum (LE)
    pub fn decode_packet(data: &[u8]) -> Result<CmfBiometricFrame, &'static str> {
        if data.len() < 10 {
            return Err("Packet too short (< 10 bytes)");
        }

        if data[0] != Self::HEADER_BYTE {
            return Err("Invalid magic sync byte (expected 0xAB)");
        }

        let opcode = data[1];
        let payload_len = u16::from_le_bytes([data[2], data[3]]) as usize;

        if data.len() < 8 + payload_len + 2 {
            return Err("Packet truncated: insufficient bytes for specified payload length");
        }

        let timestamp_sec = u32::from_le_bytes([data[4], data[5], data[6], data[7]]);
        let payload = &data[8..8 + payload_len];

        // Validate simple CRC16-CCITT or checksum
        let expected_crc = u16::from_le_bytes([data[8 + payload_len], data[8 + payload_len + 1]]);
        let calculated_crc = Self::compute_crc16(&data[0..8 + payload_len]);
        if expected_crc != calculated_crc {
            return Err("CRC16 checksum mismatch");
        }

        let (packet_type, hr, spo2, stress, steps) = match opcode {
            0x01 => {
                // Heart Rate Frame: payload[0] = instantaneous HR (BPM)
                let hr_val = if !payload.is_empty() && payload[0] > 0 {
                    Some(payload[0] as f32)
                } else {
                    None
                };
                (CmfPacketType::HeartRate, hr_val, None, None, None)
            }
            0x02 => {
                // SpO2 Frame: payload[0] = SpO2 percentage
                let spo2_val = if !payload.is_empty() && payload[0] <= 100 {
                    Some(payload[0] as f32)
                } else {
                    None
                };
                (CmfPacketType::Spo2, None, spo2_val, None, None)
            }
            0x03 => {
                // Stress Frame: payload[0] = stress score (0-100)
                let stress_val = if !payload.is_empty() && payload[0] <= 100 {
                    Some(payload[0] as f32)
                } else {
                    None
                };
                (CmfPacketType::Stress, None, None, stress_val, None)
            }
            0x04 => {
                // Step Count Frame: payload[0..4] = cumulative daily steps (u32 LE)
                let step_val = if payload.len() >= 4 {
                    Some(u32::from_le_bytes([
                        payload[0], payload[1], payload[2], payload[3],
                    ]))
                } else {
                    None
                };
                (CmfPacketType::StepCount, None, None, None, step_val)
            }
            0x05 => (CmfPacketType::SleepRecord, None, None, None, None),
            _ => (CmfPacketType::Unknown(opcode), None, None, None, None),
        };

        Ok(CmfBiometricFrame {
            packet_type,
            timestamp_sec,
            heart_rate: hr,
            spo2,
            stress,
            steps,
            raw_payload_len: payload_len,
        })
    }

    pub fn compute_crc16(bytes: &[u8]) -> u16 {
        let mut crc: u16 = 0xFFFF;
        for &b in bytes {
            crc ^= (b as u16) << 8;
            for _ in 0..8 {
                if (crc & 0x8000) != 0 {
                    crc = (crc << 1) ^ 0x1021;
                } else {
                    crc <<= 1;
                }
            }
        }
        crc
    }

    /// Decrypts an encrypted CMF Watch Pro 2 AES-128-CBC payload in Rust background thread
    pub fn decrypt_cmf_payload(
        encrypted_data: &[u8],
        key: &[u8; 16],
        iv: &[u8; 16],
    ) -> Result<Vec<u8>, &'static str> {
        use aes::Aes128;
        use cbc::cipher::{BlockDecryptMut, KeyIvInit};

        if encrypted_data.is_empty() || !encrypted_data.len().is_multiple_of(16) {
            return Err("Encrypted data must be a non-empty multiple of 16 bytes");
        }

        type Aes128CbcDec = cbc::Decryptor<Aes128>;
        let decryptor = Aes128CbcDec::new(key.into(), iv.into());

        let mut buf = encrypted_data.to_vec();
        decryptor
            .decrypt_padded_mut::<cipher::block_padding::Pkcs7>(&mut buf)
            .map(|plaintext| plaintext.to_vec())
            .map_err(|_| "AES-128-CBC PKCS7 unpadding error")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_decode_valid_hr_packet() {
        let mut packet = vec![
            0xAB, // Magic
            0x01, // OpCode: HeartRate
            0x01, 0x00, // Payload length: 1 byte
            0x40, 0xE2, 0x01, 0x00, // Timestamp: 123456 (LE)
            72,   // Heart rate: 72 BPM
        ];
        let crc = CmfProtocolDecoder::compute_crc16(&packet);
        packet.extend_from_slice(&crc.to_le_bytes());

        let frame = CmfProtocolDecoder::decode_packet(&packet).expect("Decoding failed");
        assert_eq!(frame.packet_type, CmfPacketType::HeartRate);
        assert_eq!(frame.heart_rate, Some(72.0));
        assert_eq!(frame.timestamp_sec, 123456);
    }

    #[test]
    fn test_decode_invalid_magic() {
        let packet = vec![
            0xAA, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 70, 0x00, 0x00,
        ];
        let err = CmfProtocolDecoder::decode_packet(&packet);
        assert!(err.is_err());
        assert_eq!(err.unwrap_err(), "Invalid magic sync byte (expected 0xAB)");
    }

    #[test]
    fn test_decode_crc_mismatch() {
        let packet = vec![
            0xAB, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 70, 0xFF, 0xFF,
        ];
        let err = CmfProtocolDecoder::decode_packet(&packet);
        assert!(err.is_err());
        assert_eq!(err.unwrap_err(), "CRC16 checksum mismatch");
    }
}
