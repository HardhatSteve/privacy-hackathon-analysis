import { buildPoseidon } from 'circomlibjs';

async function generateTestVectors() {
    const poseidon = await buildPoseidon();
    
    // Generate test vectors
    const testVectors = {
        singleHash: [
            {
                inputs: [123, 456],
                expected: poseidonResultToHex(poseidon([BigInt(123), BigInt(456)]))
            },
            {
                inputs: [0, 0],
                expected: poseidonResultToHex(poseidon([BigInt(0), BigInt(0)]))
            },
            {
                inputs: [1, 2, 3, 4],
                expected: poseidonResultToHex(poseidon([BigInt(1), BigInt(2), BigInt(3), BigInt(4)]))
            }
        ],
        merkleTree: [
            {
                leaves: [
                    '0x1111111111111111111111111111111111111111111111111111111111111111111111',
                    '0x2222222222222222222222222222222222222222222222222222222222222222222222222',
                    '0x3333333333333333333333333333333333333333333333333333333333333333333',
                    '0x4444444444444444444444444444444444444444444444444444444444444444444444'
                ],
                expectedRoot: poseidonResultToHex(poseidon([
                    poseidon([BigInt('0x1111111111111111111111111111111111111111111111111111111111111111111111'), BigInt('0x2222222222222222222222222222222222222222222222222222222222222222222222')]),
                    poseidon([BigInt('0x3333333333333333333333333333333333333333333333333333333333333333'), BigInt('0x4444444444444444444444444444444444444444444444444444444444444444')])
                ]))
            }
        ]
    };
    
    console.log('Generated test vectors:');
    console.log(JSON.stringify(testVectors, null, 2));
}

function poseidonResultToHex(result: any): string {
    if (result instanceof Uint8Array) {
        const hexBytes = Array.from(result)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
        return '0x' + hexBytes;
    } else if (typeof result === 'bigint') {
        return '0x' + result.toString(16).padStart(64, '0');
    } else if (typeof result === 'string') {
        return result.startsWith('0x') ? result : '0x' + result;
    } else {
        const resultStr = result.toString();
        return resultStr.startsWith('0x') ? resultStr : '0x' + resultStr;
    }
}

generateTestVectors();
