// configuracao usada no "ng serve" e nos testes (ambiente local)
// o backend libera cors pra http://localhost:4200 por padrao (AJT_CORS_ORIGINS)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:9090/api',
};
