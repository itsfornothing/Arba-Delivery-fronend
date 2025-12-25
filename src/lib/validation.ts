/**
 * Form Validation System
 * Provides real-time validation with friendly error messaging
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  custom?: (value: string) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class FormValidator {
  private static emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static phonePattern = /^[\+]?[1-9][\d]{0,15}$/;

  static validate(value: string, rules: ValidationRule): ValidationResult {
    // Required validation
    if (rules.required && (!value || value.trim().length === 0)) {
      return { isValid: false, error: 'This field is required' };
    }

    // Skip other validations if field is empty and not required
    if (!value || value.trim().length === 0) {
      return { isValid: true };
    }

    // Min length validation
    if (rules.minLength && value.length < rules.minLength) {
      return { 
        isValid: false, 
        error: `Must be at least ${rules.minLength} characters long` 
      };
    }

    // Max length validation
    if (rules.maxLength && value.length > rules.maxLength) {
      return { 
        isValid: false, 
        error: `Must be no more than ${rules.maxLength} characters long` 
      };
    }

    // Email validation
    if (rules.email && !this.emailPattern.test(value)) {
      return { 
        isValid: false, 
        error: 'Please enter a valid email address' 
      };
    }

    // Phone validation
    if (rules.phone && !this.phonePattern.test(value)) {
      return { 
        isValid: false, 
        error: 'Please enter a valid phone number' 
      };
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return { 
        isValid: false, 
        error: 'Please enter a valid format' 
      };
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        return { isValid: false, error: customError };
      }
    }

    return { isValid: true };
  }

  static validateForm(formData: Record<string, string>, rules: Record<string, ValidationRule>): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};
    let isValid = true;

    Object.keys(rules).forEach(field => {
      const value = formData[field] || '';
      const result = this.validate(value, rules[field]);
      
      if (!result.isValid && result.error) {
        errors[field] = result.error;
        isValid = false;
      }
    });

    return { isValid, errors };
  }
}

// Common validation rules
export const commonValidationRules = {
  email: { required: true, email: true },
  password: { required: true, minLength: 8 },
  confirmPassword: (password: string) => ({
    required: true,
    custom: (value: string) => value !== password ? 'Passwords do not match' : null
  }),
  phone: { required: true, phone: true },
  name: { required: true, minLength: 2, maxLength: 50 },
  address: { required: true, minLength: 5, maxLength: 200 },
  zipCode: { required: true, pattern: /^\d{5}(-\d{4})?$/ },
};