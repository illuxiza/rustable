import { typeId } from './type_id';

/**
 * Represents a variant in an enumerated type.
 * Used internally to track the current state of an enum instance.
 */
interface EnumVariant {
  name: string;
  args?: any[];
}

/**
 * Decorator for creating enum variants.
 * Use this decorator to define static factory methods that create enum instances.
 *
 * @example
 * class Result<T, E> extends Enum {
 *   @variant static Ok<T, E>(value: T): Result<T, E> { }
 *   @variant static Err<T, E>(error: E): Result<T, E> { }
 * }
 *
 * @param target The class prototype
 * @param propertyKey The name of the variant
 * @param descriptor The property descriptor
 * @returns Modified property descriptor
 */
export function variant(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  descriptor.value = function (...args: any[]) {
    const constructor = target.prototype.constructor;
    return new constructor({ name: propertyKey, args });
  };
  return descriptor;
}

/**
 * Base class for implementing Rust-style enums with pattern matching.
 * Provides a type-safe way to handle multiple variants of a type.
 *
 * @example
 * class Result<T, E> extends Enum {
 *   @variant static Ok<T, E>(value: T): Result<T, E> { }
 *   @variant static Err<T, E>(error: E): Result<T, E> { }
 *
 *   unwrap(): T {
 *     if (this.is('Ok')) return this.unwrapArg();
 *     throw new Error('Called unwrap on an Err value');
 *   }
 * }
 */
export abstract class Enum {
  private variant: EnumVariant;

  protected constructor(variant: EnumVariant) {
    this.variant = variant;
  }

  /**
   * Checks if the enum is a specific variant
   * @param variant The variant name to check
   * @returns true if the enum is the specified variant
   */
  is(variant: string): boolean {
    return this.variant.name === variant;
  }

  /**
   * Unwraps the first argument of a variant
   * @throws Error if the variant has no arguments
   * @returns The first argument of the variant
   */
  unwrap<T>(): T {
    if (!this.variant.args || this.variant.args.length === 0) {
      throw new Error('Cannot unwrap a variant without arguments');
    }
    return this.variant.args[0] as T;
  }

  /**
   * Unwraps all arguments of a variant as a tuple
   * @throws Error if the variant has no arguments
   * @returns Tuple of all variant arguments
   */
  unwrapTuple<T extends any[]>(): T {
    if (!this.variant.args || this.variant.args.length === 0) {
      throw new Error('Cannot unwrap a variant without arguments');
    }
    return this.variant.args as T;
  }

  /**
   * Converts the enum to a string representation
   * Format: VariantName for variants without arguments
   * Format: VariantName(arg1, arg2, ...) for variants with arguments
   */
  toString(): string {
    if (!this.variant.args || this.variant.args.length === 0) {
      return this.variant.name;
    }
    return `${this.variant.name}(${this.variant.args.join(', ')})`;
  }

  /**
   * Pattern matches on the enum variant, similar to Rust's match expression
   * Use this method to handle different variants of the enum in a type-safe way.
   *
   * @param patterns Object mapping variant names to handler functions
   * @param defaultPatterns Optional default patterns to use if a variant isn't matched
   * @throws Error if no matching pattern is found and no default pattern is provided
   * @example
   * ```typescript
   * enum.match({
   *   Success: (value) => `Got ${value}`,
   *   Error: (err) => `Error: ${err.message}`,
   * })
   * ```
   */
  match<U>(
    patterns: Partial<{ [key: string]: (...args: any[]) => U }>,
    defaultPatterns?: { [key: string]: (...args: any[]) => U },
  ): U {
    const variantName = this.variant.name;
    const handler = patterns[variantName] || defaultPatterns?.[variantName];

    if (!handler) {
      throw new Error(`Non-exhaustive pattern matching: missing handler for variant '${variantName}'`);
    }

    if (!this.variant.args || this.variant.args.length === 0) {
      return handler();
    }

    return handler(...this.variant.args);
  }

  [Symbol('ENUM')]() {
    return typeId(this.constructor);
  }
}