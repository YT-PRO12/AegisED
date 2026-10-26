// PostgreSQL LIKE treats backslash as its default escape character.
function literalSearch(value) {
  return "%" + value.replace(/[\\%_]/g, "\\$&") + "%";
}
module.exports = { literalSearch };
