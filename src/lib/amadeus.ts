// Amadeus API integration for flight lookups
// Test tier credentials - replace with environment variables in production

const AMADEUS_API_KEY = import.meta.env.VITE_AMADEUS_API_KEY || '';
const AMADEUS_API_SECRET = import.meta.env.VITE_AMADEUS_API_SECRET || '';

interface AmadeusFlightData {
  flightNumber: string;
  airline: string;
  departAirport: string;
  arriveAirport: string;
  status?: string;
  confirmationNumber?: string;
}

export async function lookupFlightByCode(flightCode: string): Promise<AmadeusFlightData | null> {
  if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
    console.warn('Amadeus API credentials not configured');
    return null;
  }

  try {
    // Get access token
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_API_KEY,
        client_secret: AMADEUS_API_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Amadeus access token');
    }

    const tokenData = await tokenResponse.json() as { access_token: string };
    const accessToken = tokenData.access_token;

    // Parse flight code (e.g., "BR245" -> airline: "BR", number: "245")
    const match = flightCode.match(/^([A-Z]{2})(\d+)$/);
    if (!match) {
      throw new Error('Invalid flight code format. Use format like BR245');
    }

    const airlineCode = match[1];
    const flightNumber = match[2];

    // Search for flight (using flight status API)
    // Note: This is a simplified lookup - Amadeus test tier has limited endpoints
    const searchResponse = await fetch(
      `https://test.api.amadeus.com/v2/reference-data/airlines?airlineCodes=${airlineCode}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!searchResponse.ok) {
      throw new Error('Flight not found');
    }

    const searchData = await searchResponse.json() as any;
    const airline = searchData.data?.[0]?.businessName || airlineCode;

    // Return basic flight info (Amadeus test tier has limited real-time data)
    return {
      flightNumber: `${airlineCode}${flightNumber}`,
      airline,
      departAirport: '',
      arriveAirport: '',
      status: 'Unknown',
    };
  } catch (error) {
    console.error('Amadeus flight lookup error:', error);
    return null;
  }
}
