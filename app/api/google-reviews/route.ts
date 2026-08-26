export const dynamic = "force-dynamic";

type GoogleReview = {
  rating?: number;

  text?: {
    text?: string;
    languageCode?: string;
  };

  originalText?: {
    text?: string;
    languageCode?: string;
  };

  relativePublishTimeDescription?: string;

  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };

  googleMapsUri?: string;
};

type GooglePlaceResponse = {
  id?: string;

  displayName?: {
    text?: string;
  };

  rating?: number;

  userRatingCount?: number;

  googleMapsUri?: string;

  reviews?: GoogleReview[];
};

export async function GET() {
  try {
    const apiKey =
      process.env.GOOGLE_PLACES_API_KEY;

    const placeId =
      process.env.GOOGLE_PLACE_ID;

    if (!apiKey || !placeId) {
      return Response.json(
        {
          ok: false,
          error:
            "Google Reviews environment variables are missing.",
        },
        {
          status: 500,
        }
      );
    }

    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        method: "GET",

        headers: {
          "X-Goog-Api-Key":
            apiKey,

          "X-Goog-FieldMask":
            [
              "id",
              "displayName",
              "rating",
              "userRatingCount",
              "googleMapsUri",
              "reviews",
            ].join(","),
        },

        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "Google Places API error:",
        errorText
      );

      return Response.json(
        {
          ok: false,
          error:
            "Google Places request failed.",
          details:
            errorText,
        },
        {
          status:
            response.status,
        }
      );
    }

    const data =
      (await response.json()) as GooglePlaceResponse;

    const reviews =
      (data.reviews || []).map(
        (review) => ({
          rating:
            review.rating || 0,

          text:
            review.text?.text ||
            review.originalText
              ?.text ||
            "",

          relativeTime:
            review.relativePublishTimeDescription ||
            "",

          author: {
            name:
              review
                .authorAttribution
                ?.displayName ||
              "Google user",

            profileUrl:
              review
                .authorAttribution
                ?.uri ||
              "",

            photoUrl:
              review
                .authorAttribution
                ?.photoUri ||
              "",
          },

          googleMapsUri:
            review.googleMapsUri ||
            "",
        })
      );

    return Response.json(
      {
        ok: true,

        place: {
          id:
            data.id || "",

          name:
            data.displayName
              ?.text ||
            "Bucketlist Adventure",

          rating:
            data.rating || 0,

          reviewCount:
            data.userRatingCount ||
            0,

          googleMapsUri:
            data.googleMapsUri ||
            "",
        },

        reviews,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET /api/google-reviews failed:",
      error
    );

    return Response.json(
      {
        ok: false,
        error:
          "Unable to load Google Reviews.",
      },
      {
        status: 500,
      }
    );
  }
}