import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'hopital-maroc',
  clientId: 'hopital-app',
});

export default keycloak;