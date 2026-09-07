import React from 'react';

export default function JsonLd() {
  const hotelSchema = {
    "@context": "https://schema.org",
    "@type": ["Hotel", "LocalBusiness"],
    "name": "Hotel Sherpa Soul",
    "description": "A peaceful and affordable hotel in Thamel, Kathmandu with no restaurant noise, offering clean rooms, high-speed Wi-Fi, and a dedicated shared kitchen for long stays.",
    "url": "https://hotelsherpasoul.com",
    "telephone": "+9779851068219",
    "email": "info@hotelsherpasoul.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Thamel",
      "addressLocality": "Kathmandu",
      "postalCode": "44600",
      "addressCountry": "NP"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 27.7154,
      "longitude": 85.3123
    },
    "priceRange": "$20 - $30 USD",
    "checkinTime": "14:00",
    "checkoutTime": "12:00",
    "amenityFeature": [
      { "@type": "LocationFeatureSpecification", "name": "Free High-Speed Wi-Fi", "value": true },
      { "@type": "LocationFeatureSpecification", "name": "24/7 Hot Water", "value": true },
      { "@type": "LocationFeatureSpecification", "name": "Shared Guest Kitchen (Room 102)", "value": true },
      { "@type": "LocationFeatureSpecification", "name": "Quiet Sleep Atmosphere", "value": true },
      { "@type": "LocationFeatureSpecification", "name": "Luggage Storage", "value": true }
    ],
    "image": [
      "https://hotelsherpasoul.com/images/logo.png",
      "https://hotelsherpasoul.com/images/doubleBedRoom.jpeg",
      "https://hotelsherpasoul.com/images/doubleBed.jpeg",
      "https://hotelsherpasoul.com/images/frontend_desk.jpeg"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Direct Booking Rates",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "HotelRoom",
            "name": "Budget Family Room",
            "occupancy": { "@type": "QuantitativeValue", "maxValue": 4 }
          },
          "price": "20.00",
          "priceCurrency": "USD"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "HotelRoom",
            "name": "Family Room",
            "occupancy": { "@type": "QuantitativeValue", "maxValue": 4 }
          },
          "price": "30.00",
          "priceCurrency": "USD"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "HotelRoom",
            "name": "Deluxe Room",
            "occupancy": { "@type": "QuantitativeValue", "maxValue": 3 }
          },
          "price": "20.00",
          "priceCurrency": "USD"
        }
      ]
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelSchema) }}
    />
  );
}
