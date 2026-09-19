let csrfToken = "";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
export function setCsrf(token) {
  csrfToken = token || "";
}
export async function request(path, { method = "GET", body, signal } = {}) {
  const response = await fetch(API_BASE_URL + path, {
    method,
    credentials: "include",
    signal,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(!["GET", "HEAD"].includes(method)
        ? { "X-CSRF-Token": csrfToken }
        : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response
    .json()
    .catch(() => ({ message: "The server returned an invalid response" }));
  if (!response.ok) {
    const e = new Error(result.message || "Request failed");
    e.status = response.status;
    if (
      response.status === 401 &&
      path !== "/auth/login" &&
      path !== "/auth/me"
    )
      window.dispatchEvent(new Event("careflow:expired"));
    throw e;
  }
  return result;
}
export const getPatients = async () =>
  (await request("/patients?limit=100")).data;
export const getEmergencyCases = async () =>
  (await request("/emergency-cases?limit=100")).data;
export const getDoctors = async () =>
  (await request("/doctors?limit=100")).data;
export const getBeds = async () => (await request("/beds?limit=100")).data;
export const getDashboardStats = async () =>
  (await request("/dashboard/stats")).data;
export const assignDoctor = async (id, doctorId) =>
  (
    await request(`/emergency-cases/${id}/assign-doctor`, {
      method: "POST",
      body: { doctorId },
    })
  ).data;
export const assignBed = async (id, bedId) =>
  (
    await request(`/emergency-cases/${id}/assign-bed`, {
      method: "POST",
      body: { bedId },
    })
  ).data;
export const startTreatment = async (id) =>
  (await request(`/emergency-cases/${id}/start-treatment`, { method: "POST" }))
    .data;
export const completeTreatment = async (id) =>
  (
    await request(`/emergency-cases/${id}/complete-treatment`, {
      method: "POST",
    })
  ).data;
export const dischargePatient = async (id) =>
  (await request(`/emergency-cases/${id}/discharge`, { method: "POST" })).data;
