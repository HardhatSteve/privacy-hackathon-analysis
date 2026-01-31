declare module 'buffer-layout' {
  export interface Layout<T = any> {
    span: number;
    decode(b: Buffer, offset?: number): T;
    encode(src: T, b: Buffer, offset?: number): number;
    replicate(): Layout<T>;
  }

  export function blob(length: number, property?: string): Layout<Buffer>;
  export function u8(property?: string): Layout<number>;
  export function u16(property?: string): Layout<number>;
  export function u32(property?: string): Layout<number>;
  export function u64(property?: string): Layout<number>;
  export function i8(property?: string): Layout<number>;
  export function i16(property?: string): Layout<number>;
  export function i32(property?: string): Layout<number>;
  export function i64(property?: string): Layout<number>;
  export function f32(property?: string): Layout<number>;
  export function f64(property?: string): Layout<number>;
  export function struct<T extends Record<string, Layout<any>>>(fields: T, property?: string): Layout<{ [K in keyof T]: T[K] extends Layout<infer V> ? V : never }>;
  export function union<T extends Record<string, Layout<any>>>(discriminator: Layout<number>, layouts: T, property?: string): Layout<{ [K in keyof T]: T[K] extends Layout<infer V> ? V : never }>;
  export function bits<T extends Record<string, number>>(bitWidth: number, msb: boolean, property?: string): Layout<T>;
  export function seq<T>(elementLayout: Layout<T>, count: number, property?: string): Layout<T[]>;
  export function offset<T>(layout: Layout<T>, offset: number): Layout<T>;
  export function greased<T>(layout: Layout<T>, factor: number, property?: string): Layout<T>;
  export function constLayout<T>(value: T, property?: string): Layout<T>;
  export function fixedBlob(length: number, property?: string): Layout<Buffer>;
  export function nearStruct<T extends Record<string, Layout<any>>>(fields: T, property?: string): Layout<{ [K in keyof T]: T[K] extends Layout<infer V> ? V : never }>;
}
