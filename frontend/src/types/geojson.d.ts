declare module '*.geojson' {
  const value: {
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      properties: {
        id: string;
        name: string;
      };
      geometry: {
        type: 'Polygon';
        coordinates: number[][][];
      };
    }>;
  };
  export default value;
}

