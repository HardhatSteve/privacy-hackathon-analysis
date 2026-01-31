/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/pigeon_program.json`.
 */
export type PigeonProgram = {
  "address": "4tPu12rEL3zjVXeKx5hTbDt4dH3dbo6dTELYfVGUGQyv",
  "metadata": {
    "name": "pigeonProgram",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "registerUser",
      "discriminator": [
        2,
        241,
        150,
        223,
        99,
        214,
        116,
        97
      ],
      "accounts": [
        {
          "name": "userAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "encryptionKey",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "sendDm",
      "discriminator": [
        98,
        158,
        242,
        215,
        245,
        45,
        228,
        233
      ],
      "accounts": [
        {
          "name": "chatAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "participantA"
              },
              {
                "kind": "account",
                "path": "participantB"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "participantA"
        },
        {
          "name": "participantB"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "encryptedText",
          "type": "bytes"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "chatAccount",
      "discriminator": [
        188,
        218,
        213,
        242,
        64,
        84,
        104,
        17
      ]
    },
    {
      "name": "userAccount",
      "discriminator": [
        211,
        33,
        136,
        16,
        186,
        110,
        242,
        127
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "messageTooLong",
      "msg": "Message too long!"
    },
    {
      "code": 6001,
      "name": "emptyMessage",
      "msg": "Message cannot be empty!"
    },
    {
      "code": 6002,
      "name": "chatFull",
      "msg": "Chat is full! Maximum 10 messages reached."
    },
    {
      "code": 6003,
      "name": "invalidParticipants",
      "msg": "Chat participants do not match expected addresses."
    },
    {
      "code": 6004,
      "name": "unauthorizedSender",
      "msg": "Only chat participants can send messages."
    }
  ],
  "types": [
    {
      "name": "chatAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "participants",
            "type": {
              "array": [
                "pubkey",
                2
              ]
            }
          },
          {
            "name": "messages",
            "type": {
              "vec": {
                "defined": {
                  "name": "directMessage"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "directMessage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "sender",
            "type": "pubkey"
          },
          {
            "name": "encryptedPayload",
            "type": {
              "array": [
                "u8",
                308
              ]
            }
          },
          {
            "name": "payloadLen",
            "type": "u16"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "userAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "encryptionPubkey",
            "type": "pubkey"
          }
        ]
      }
    }
  ]
};
