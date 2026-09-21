export const mockGeologicalBoundaries = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        formation: "Sausar Group",
        rockType: "Gondite",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.05, 21.15],
            [79.15, 21.18],
            [79.18, 21.10],
            [79.08, 21.05],
            [79.05, 21.15],
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        formation: "Tirodi Gneiss",
        rockType: "Biotite Gneiss",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.15, 21.18],
            [79.25, 21.20],
            [79.30, 21.12],
            [79.18, 21.10],
            [79.15, 21.18],
          ]
        ]
      }
    }
  ]
};

export const mockProspectivityZones = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        score: 0.85,
        zoneName: "High Potential Alpha",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.10, 21.12],
            [79.13, 21.14],
            [79.14, 21.10],
            [79.11, 21.08],
            [79.10, 21.12],
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        score: 0.65,
        zoneName: "Moderate Potential Beta",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.20, 21.15],
            [79.24, 21.17],
            [79.26, 21.13],
            [79.22, 21.11],
            [79.20, 21.15],
          ]
        ]
      }
    }
  ]
};

export const mockFaultLines = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { type: "Major Fault" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.05, 21.08],
          [79.15, 21.14],
          [79.25, 21.18]
        ]
      }
    },
    {
      type: "Feature",
      properties: { type: "Minor Fracture" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.12, 21.05],
          [79.14, 21.15],
          [79.20, 21.22]
        ]
      }
    }
  ]
};

// Generate some random clustered points for the heatmap around target areas
export const mockAnomalies = {
  type: "FeatureCollection",
  features: Array.from({ length: 100 }, (_, i) => {
    // Cluster 1 (around 79.12, 21.12)
    // Cluster 2 (around 79.22, 21.15)
    const isCluster1 = i < 60;
    const centerLng = isCluster1 ? 79.12 : 79.22;
    const centerLat = isCluster1 ? 21.12 : 21.15;
    
    // add some gaussian noise
    const lng = centerLng + (Math.random() - 0.5) * 0.08;
    const lat = centerLat + (Math.random() - 0.5) * 0.08;
    
    return {
      type: "Feature",
      properties: {
        intensity: Math.random() // Used for heatmap weight
      },
      geometry: {
        type: "Point",
        coordinates: [lng, lat]
      }
    };
  })
};
