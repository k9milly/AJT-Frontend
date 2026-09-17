// configuracao do build de producao (substitui environment.ts via fileReplacements no angular.json)
// em producao o front e o back ficam atras do mesmo dominio, por isso o caminho relativo
export const environment = {
  production: true,
  apiUrl: '/api',
};
