export function extractRolesFromReq (body) {
  return (body.data.roles || []).map(function (role) {
    return role.data.attributes.name;
  });
}
