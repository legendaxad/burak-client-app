import { fireEvent, render, screen } from '@testing-library/react-native';

import { ProductImage } from '../components/product-image';

describe('ProductImage', () => {
  it('shows a placeholder instead of a fabricated photo when the product has no image', async () => {
    await render(<ProductImage collection="DISH" showCaption />);
    expect(screen.getByLabelText('No photo available')).toBeOnTheScreen();
    expect(screen.getByText('No photo yet')).toBeOnTheScreen();
  });

  it('falls back to the placeholder when the remote image fails to load', async () => {
    await render(<ProductImage path="uploads/products/missing.png" collection="DRINK" />);
    expect(screen.queryByLabelText('No photo available')).toBeNull();
    const image = screen.getByTestId('product-image');
    // expo-image normalises `source` into an array on the host component.
    expect([image.props.source].flat()).toEqual([{ uri: 'http://api.test/uploads/products/missing.png' }]);
    await fireEvent(image, 'error', { nativeEvent: { error: 'HTTP 404' } });
    expect(screen.getByLabelText('No photo available')).toBeOnTheScreen();
  });
});
