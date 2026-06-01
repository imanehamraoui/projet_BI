import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:9090',
  realm: 'hospital',
  clientId: 'frontend',
});

export default keycloak;