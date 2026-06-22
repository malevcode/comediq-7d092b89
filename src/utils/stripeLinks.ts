export const getValidStripePaymentLink = (
  ...candidates: Array<string | undefined>
) => {
  const link = candidates.find((candidate) => candidate?.trim())?.trim();
  if (!link || link.includes('/your_')) return '';

  try {
    const url = new URL(link);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('stripe.com')) {
      return '';
    }

    return url.toString();
  } catch {
    return '';
  }
};
