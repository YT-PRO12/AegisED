const c = require("../services/crud")("doctor");
module.exports = {
  getDoctors: c.list,
  getDoctorById: c.get,
  createDoctor: c.create,
  updateDoctor: c.update,
  deleteDoctor: c.remove,
};
