export const LIFECYCLES = ["draft", "verified", "published"];
export const PUBLICATION_REQUIREMENTS = [
  "identity",
  "status",
  "coordinates",
  "forecastElevation",
  "locality",
  "officialUrl",
];

function populated(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateRecord(record) {
  const errors = [];
  const fail = (message) => errors.push(`${record?.recordId ?? "<unknown>"}: ${message}`);
  if (!populated(record?.recordId)) fail("recordId is required");
  if (!LIFECYCLES.includes(record?.lifecycle)) fail("invalid lifecycle");
  const expectedHistory = LIFECYCLES.slice(0, LIFECYCLES.indexOf(record?.lifecycle) + 1);
  if (
    !Array.isArray(record?.lifecycleHistory) ||
    JSON.stringify(record.lifecycleHistory) !== JSON.stringify(expectedHistory)
  ) {
    fail(`lifecycleHistory must be ${expectedHistory.join(" -> ")}`);
  }
  if (!populated(record?.countryCode) || !/^[A-Z]{2}$/.test(record.countryCode)) fail("countryCode must be ISO alpha-2");
  if (!populated(record?.country)) fail("country is required");
  if (!populated(record?.timezone)) fail("timezone is required");

  if (record?.lifecycle === "published") {
    if (record.classification !== "verified_operating") {
      fail("published classification must be verified_operating");
    }
    if (
      !populated(record?.identity?.publicId) ||
      !populated(record?.identity?.name) ||
      !Array.isArray(record?.identity?.aliases)
    ) fail("published identity is incomplete");
    if (
      !Number.isFinite(record?.coordinates?.lat) ||
      record.coordinates.lat < -90 ||
      record.coordinates.lat > 90 ||
      !Number.isFinite(record?.coordinates?.lng) ||
      record.coordinates.lng < -180 ||
      record.coordinates.lng > 180
    ) fail("published coordinates are invalid");
    if (!Number.isFinite(record?.elevations?.forecastM)) fail("published forecast elevation is incomplete or invalid");
    if (record?.facilityType != null && !["alpine", "club_field", "hike_in_club_field", "nordic", "indoor"].includes(record.facilityType)) {
      fail("published facilityType is invalid");
    }
    if (record?.countryCode === "NZ" && (!populated(record?.accessModel) || !populated(record?.publicCopy))) {
      fail("published accessModel and publicCopy are required");
    }
    if (record.facilityType === "indoor" && (record.weatherEligible !== false || record.alertEligible !== false)) {
      fail("indoor facilities must explicitly disable mountain weather and powder alerts");
    }
    if (
      !populated(record?.locality?.regionId) ||
      !populated(record?.locality?.regionName) ||
      !populated(record?.locality?.stateOrProvince) ||
      !populated(record?.locality?.localityId) ||
      !populated(record?.locality?.localityName)
    ) fail("published locality is incomplete");
    try {
      const url = new URL(record?.officialUrl);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    } catch {
      fail("published officialUrl must be an absolute HTTP URL");
    }
    const evidence = Array.isArray(record?.evidence) ? record.evidence : [];
    const supported = new Set();
    const expectedValues = {
      identity: record.identity,
      status: record.classification,
      coordinates: record.coordinates,
      forecastElevation: record.elevations?.forecastM,
      locality: record.locality,
      officialUrl: record.officialUrl,
    };
    if (record?.countryCode === "NZ" && record?.evidenceTable) {
      const table = record.evidenceTable;
      const citations = table.fieldCitations;
      const requiredCitationFields = [...PUBLICATION_REQUIREMENTS];
      try {
        const officialEvidence = new URL(table.officialUrl);
        const coordinateEvidence = new URL(table.coordinatesUrl);
        if (officialEvidence.origin !== new URL(record.officialUrl).origin) {
          fail("NZ evidence table official URL is not from the operator");
        }
        const exactMarker = coordinateEvidence.hostname === "www.openstreetmap.org" &&
          coordinateEvidence.searchParams.get("mlat") === String(record.coordinates.lat) &&
          coordinateEvidence.searchParams.get("mlon") === String(record.coordinates.lng);
        if (!exactMarker) fail("NZ evidence table coordinates URL is not an exact OpenStreetMap marker");
      } catch {
        fail("NZ evidence table URLs must be absolute HTTP URLs");
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(table.retrievedAt ?? "")) {
        fail("NZ evidence table requires retrievedAt");
      }
      if (!citations || typeof citations !== "object") {
        fail("NZ evidence table requires field-level citations");
      } else {
        for (const field of requiredCitationFields) {
          const fieldCitation = citations[field];
          if (!fieldCitation || typeof fieldCitation !== "object" || !populated(fieldCitation.citation)) {
            fail(`NZ evidence table lacks ${field} citation`);
          } else {
            const expectedUrl = field === "coordinates" ? table.coordinatesUrl : table.officialUrl;
            const secondarySources = Array.isArray(table.secondarySources) ? table.secondarySources : [];
            const permittedSecondary = secondarySources.includes(fieldCitation.url);
            try {
              const citationUrl = new URL(fieldCitation.url);
              if (!["http:", "https:"].includes(citationUrl.protocol)) throw new Error();
            } catch {
              fail(`NZ evidence table ${field} citation URL is invalid`);
              continue;
            }
            if (fieldCitation.url !== expectedUrl && !permittedSecondary) {
              fail(`NZ evidence table ${field} citation uses the wrong source URL`);
              continue;
            }
            const boilerplate = [
              "official operator page identifies the facility by this operating name",
              "official operator page publishes the current facility and visitor operation information",
              "official operator access, trail or mountain information supports the stated forecast elevation band",
              "official operator page identifies this practical gateway locality for access",
              "official operator url for the facility",
            ];
            if (boilerplate.includes(fieldCitation.citation.toLowerCase().replace(/\.$/, ""))) {
              fail(`NZ evidence table ${field} citation is boilerplate`);
              continue;
            }
            if (["status", "forecastElevation", "locality"].includes(field) && fieldCitation.citation.length < 55) {
              fail(`NZ evidence table ${field} citation lacks candidate-specific detail`);
              continue;
            }
            supported.add(field);
          }
        }
      }
    }
    for (const item of evidence) {
      let evidenceUrl;
      try {
        evidenceUrl = new URL(item?.url);
        if (!["http:", "https:"].includes(evidenceUrl.protocol)) throw new Error();
      } catch {
        fail("evidence URL must be an absolute HTTP URL");
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(item?.retrievedAt ?? "")) fail("evidence retrievedAt is required");
      if (record.evidenceSchemaVersion !== 2 || !Array.isArray(item?.fields)) {
        fail("evidence must include field-specific citations");
        continue;
      }
      for (const citation of item.fields) {
        if (!PUBLICATION_REQUIREMENTS.includes(citation?.field) || citation?.value == null || !populated(citation?.citation)) {
          fail("evidence field citation must name a publication field, value, and citation");
          continue;
        }
        if (JSON.stringify(citation.value) !== JSON.stringify(expectedValues[citation.field])) {
          fail(`evidence citation value does not match ${citation.field}`);
          continue;
        }
        const officialFields = ["identity", "status", "officialUrl", "locality"];
        if (officialFields.includes(citation.field)) {
          try {
            if (evidenceUrl.origin !== new URL(record.officialUrl).origin) {
              fail(`${citation.field} citation is not from the official operator`);
              continue;
            }
          } catch {
            fail(`${citation.field} citation is not from the official operator`);
            continue;
          }
        }
        if (citation.field === "coordinates") {
          const marker = evidenceUrl?.hostname === "www.openstreetmap.org" &&
            evidenceUrl.searchParams.get("mlat") === String(record.coordinates.lat) &&
            evidenceUrl.searchParams.get("mlon") === String(record.coordinates.lng);
          if (!marker) {
            fail("coordinates citation is not an exact OpenStreetMap marker");
            continue;
          }
        }
        if (citation.field === "forecastElevation") {
          const epqs = evidenceUrl?.hostname === "epqs.nationalmap.gov" &&
            evidenceUrl.searchParams.get("x") === String(record.coordinates.lng) &&
            evidenceUrl.searchParams.get("y") === String(record.coordinates.lat) &&
            evidenceUrl.searchParams.get("units") === "Meters";
          let officialOperator = false;
          try {
            officialOperator = evidenceUrl?.origin === new URL(record.officialUrl).origin;
          } catch {
            officialOperator = false;
          }
          if (!epqs && !officialOperator) {
            fail("forecast elevation citation must be exact-point USGS EPQS or official operator data");
            continue;
          }
        }
        supported.add(citation.field);
      }
    }
    for (const requirement of PUBLICATION_REQUIREMENTS) {
      if (!supported.has(requirement)) fail(`evidence does not support ${requirement}`);
    }
  }
  return errors;
}

export function validateCatalogue(records) {
  const errors = records.flatMap(validateRecord);
  const recordIds = new Set();
  const publicIds = new Set();
  const routes = new Set();
  for (const record of records) {
    if (recordIds.has(record.recordId)) errors.push(`duplicate recordId: ${record.recordId}`);
    recordIds.add(record.recordId);
    if (record.lifecycle !== "published") continue;
    const publicId = record.identity?.publicId;
    const route = `/${record.locality?.regionId}/mountain/${publicId}`;
    if (publicIds.has(publicId)) errors.push(`duplicate published publicId: ${publicId}`);
    if (routes.has(route)) errors.push(`duplicate published route: ${route}`);
    publicIds.add(publicId);
    routes.add(route);
  }
  return errors;
}

export function publicProjection(record) {
  if (record.lifecycle !== "published") return undefined;
  const { identity, coordinates, elevations, locality } = record;
  return {
    recordId: record.recordId,
    publicId: identity.publicId,
    aliases: identity.aliases,
    name: identity.name,
    coordinates,
    forecastElevationM: elevations.forecastM,
    officialUrl: record.officialUrl,
    regionId: locality.regionId,
    regionName: locality.regionName,
    stateOrProvince: locality.stateOrProvince,
    localityId: locality.localityId,
    localityName: locality.localityName,
    route: `/${locality.regionId}/mountain/${identity.publicId}`,
    country: record.country,
    countryCode: record.countryCode,
    timezone: record.timezone,
    facilityType: record.facilityType ?? "alpine",
    accessModel: record.accessModel ?? "Public lift-served ski area.",
    publicCopy: record.publicCopy ?? `${identity.name} is an outdoor lift-served ski area.`,
    weatherEligible: record.weatherEligible !== false,
    alertEligible: record.alertEligible !== false,
  };
}