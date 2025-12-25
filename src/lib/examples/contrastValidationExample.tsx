/**
 * Color Contrast Validation Examples
 * Demonstrates how to use the contrast validation utilities in React components
 */

import React from 'react';
import { 
  useContrastValidation, 
  withContrastValidation, 
  validateComponentColors,
  validateTailwindClasses 
} from '../contrastValidator';
import { enhancedTheme } from '../theme';

// Example 1: Using the useContrastValidation hook
export const ButtonWithValidation: React.FC<{
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
}> = ({ variant, children }) => {
  const colors = {
    primary: {
      foreground: enhancedTheme.colors.neutral[50],
      background: enhancedTheme.colors.primary[500]
    },
    secondary: {
      foreground: enhancedTheme.colors.primary[500],
      background: enhancedTheme.colors.neutral[50]
    }
  };

  const { foreground, background } = colors[variant];
  
  // This will automatically warn in development if contrast is poor
  const contrastResult = useContrastValidation(
    foreground,
    background,
    `Button (${variant})`,
    { fontSize: 16, fontWeight: 500 }
  );

  return (
    <button
      style={{
        color: foreground,
        backgroundColor: background,
        padding: '12px 24px',
        border: 'none',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: 500,
        cursor: 'pointer'
      }}
      title={contrastResult ? `Contrast: ${contrastResult.ratio}:1 (${contrastResult.level})` : undefined}
    >
      {children}
    </button>
  );
};

// Example 2: Using the HOC for automatic validation
const BaseCard: React.FC<{
  textColor: string;
  backgroundColor: string;
  children: React.ReactNode;
}> = ({ textColor, backgroundColor, children }) => (
  <div
    style={{
      color: textColor,
      backgroundColor,
      padding: '16px',
      borderRadius: '8px',
      margin: '8px 0'
    }}
  >
    {children}
  </div>
);

export const ValidatedCard = withContrastValidation(
  BaseCard,
  (props) => ({
    foreground: props.textColor,
    background: props.backgroundColor
  }),
  { fontSize: 16 }
);

// Example 3: Component with prop validation
export const CustomAlert: React.FC<{
  type: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}> = ({ type, children }) => {
  const alertStyles = {
    success: {
      color: enhancedTheme.colors.success[700],
      backgroundColor: enhancedTheme.colors.success[50],
      borderColor: enhancedTheme.colors.success[200]
    },
    warning: {
      color: enhancedTheme.colors.warning[700],
      backgroundColor: enhancedTheme.colors.warning[50],
      borderColor: enhancedTheme.colors.warning[200]
    },
    error: {
      color: enhancedTheme.colors.error[700],
      backgroundColor: enhancedTheme.colors.error[50],
      borderColor: enhancedTheme.colors.error[200]
    },
    info: {
      color: enhancedTheme.colors.info[700],
      backgroundColor: enhancedTheme.colors.info[50],
      borderColor: enhancedTheme.colors.info[200]
    }
  };

  const style = alertStyles[type];

  // Validate colors using prop validator
  React.useEffect(() => {
    validateComponentColors(
      { textColor: style.color, bgColor: style.backgroundColor },
      `CustomAlert (${type})`,
      [{ foregroundProp: 'textColor', backgroundProp: 'bgColor' }]
    );
  }, [type, style.color, style.backgroundColor]);

  return (
    <div
      style={{
        color: style.color,
        backgroundColor: style.backgroundColor,
        border: `1px solid ${style.borderColor}`,
        padding: '12px 16px',
        borderRadius: '6px',
        margin: '8px 0'
      }}
    >
      {children}
    </div>
  );
};

// Example 4: Tailwind class validation
export const TailwindButton: React.FC<{
  className: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  React.useEffect(() => {
    validateTailwindClasses(className, 'TailwindButton', enhancedTheme);
  }, [className]);

  return (
    <button className={className}>
      {children}
    </button>
  );
};

// Example 5: Comprehensive validation demo
export const ContrastValidationDemo: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      <h2>Color Contrast Validation Examples</h2>
      
      <section>
        <h3>1. Button with Validation Hook</h3>
        <ButtonWithValidation variant="primary">Primary Button</ButtonWithValidation>
        <ButtonWithValidation variant="secondary">Secondary Button</ButtonWithValidation>
      </section>

      <section>
        <h3>2. HOC Validated Card</h3>
        <ValidatedCard
          textColor={enhancedTheme.colors.neutral[700]}
          backgroundColor={enhancedTheme.colors.neutral[50]}
        >
          This card uses the HOC for automatic validation
        </ValidatedCard>
        
        {/* This will trigger a warning in development */}
        <ValidatedCard
          textColor={enhancedTheme.colors.neutral[300]}
          backgroundColor={enhancedTheme.colors.neutral[50]}
        >
          This card has poor contrast and will show a warning
        </ValidatedCard>
      </section>

      <section>
        <h3>3. Alert Components with Prop Validation</h3>
        <CustomAlert type="success">Success message</CustomAlert>
        <CustomAlert type="warning">Warning message</CustomAlert>
        <CustomAlert type="error">Error message</CustomAlert>
        <CustomAlert type="info">Info message</CustomAlert>
      </section>

      <section>
        <h3>4. Tailwind Validation (if using Tailwind)</h3>
        <TailwindButton className="bg-primary-500 text-white px-4 py-2 rounded">
          Tailwind Button
        </TailwindButton>
      </section>

      <section>
        <h3>5. Manual Validation Examples</h3>
        <div style={{ marginTop: '16px' }}>
          <p>Check the browser console for validation warnings and info messages.</p>
          <p>These utilities help ensure WCAG 2.1 AA compliance during development.</p>
        </div>
      </section>
    </div>
  );
};

// Example usage in a real component
export const ProductCard: React.FC<{
  title: string;
  price: string;
  description: string;
}> = ({ title, price, description }) => {
  // Validate the color combinations used in this component
  const titleColor = enhancedTheme.colors.neutral[900];
  const priceColor = enhancedTheme.colors.primary[600];
  const descriptionColor = enhancedTheme.colors.neutral[600];
  const backgroundColor = enhancedTheme.colors.neutral[50];

  useContrastValidation(titleColor, backgroundColor, 'ProductCard Title', { fontSize: 20, fontWeight: 600 });
  useContrastValidation(priceColor, backgroundColor, 'ProductCard Price', { fontSize: 18, fontWeight: 500 });
  useContrastValidation(descriptionColor, backgroundColor, 'ProductCard Description', { fontSize: 14 });

  return (
    <div
      style={{
        backgroundColor,
        padding: '16px',
        borderRadius: '8px',
        border: `1px solid ${enhancedTheme.colors.neutral[200]}`,
        maxWidth: '300px'
      }}
    >
      <h3 style={{ color: titleColor, fontSize: '20px', fontWeight: 600, margin: '0 0 8px 0' }}>
        {title}
      </h3>
      <p style={{ color: priceColor, fontSize: '18px', fontWeight: 500, margin: '0 0 12px 0' }}>
        {price}
      </p>
      <p style={{ color: descriptionColor, fontSize: '14px', margin: 0 }}>
        {description}
      </p>
    </div>
  );
};