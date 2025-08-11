# Google Maps Setup (Optional)

This document explains how to set up Google Maps API for embedded maps in the Cities page.

## Current Implementation

The Cities page currently shows clickable map placeholders that open Google Maps in a new tab. This works without any API key setup.

## To Enable Embedded Maps (Optional)

If you want to show actual embedded Google Maps instead of clickable placeholders:

### 1. Get a Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Maps Embed API"
4. Go to "Credentials" and create an API key
5. Restrict the API key to your domain for security

### 2. Add the API Key to Environment Variables

Add this line to your `.env.local` file:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 3. Update the PlaceMap Component

Replace the current clickable map placeholder with an iframe-based implementation:

```tsx
// In src/app/cities/page.tsx, replace the PlaceMap component with:
function PlaceMap({ place }: { place: any }) {
  const getLocationQuery = () => {
    const parts = [place.name]
    if (place.city) parts.push(place.city)
    if (place.state) parts.push(place.state)
    if (place.country) parts.push(place.country)
    return encodeURIComponent(parts.join(', '))
  }

  return (
    <iframe
      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${getLocationQuery()}&zoom=15`}
      width="100%"
      height="192"
      style={{ border: 0 }}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  )
}
```

## Current Features

- ✅ Clickable map placeholders with location info
- ✅ Opens Google Maps in new tab when clicked
- ✅ Shows place name and location details
- ✅ Beautiful gradient backgrounds with map icons
- ✅ Hover effects and animations
- ✅ No API key required

## Notes

- The current implementation works perfectly without any setup
- Embedded maps require a Google Maps API key and may have usage costs
- The clickable maps provide good user experience and work universally
