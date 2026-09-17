import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { Pagina } from '../../core/models/api.model';
import { Transfer } from '../../core/models/transfer.model';
import { TransferService } from './transfer.service';

/*
 * o que testa: o contrato http do TransferService com o backend
 * (url, metodo, query params de paginacao/filtro e corpo enviado).
 * serve de modelo pros outros services, que seguem exatamente o mesmo formato.
 *
 * como rodar: TestBed com HttpTestingController (http falso). roda com "npm test".
 * nao precisa do backend no ar: o teste confere o que o front MANDA, e responde com dado fixo.
 *
 * por que existe:
 * - listagens agora sao paginadas: se o front ler o array direto (formato antigo), a tela fica
 *   vazia sem erro nenhum. o teste garante que o envelope { conteudo, ... } e o que chega.
 * - vincular transfer a uma os usa PUT com o transfer inteiro. se o valorBase nao for reenviado,
 *   o backend reconverte o valor em moeda estrangeira com a cotacao de hoje e altera um valor
 *   que ja estava fechado. o ultimo teste protege essa regra.
 */
describe('TransferService', () => {
  let service: TransferService;
  let http: HttpTestingController;

  const base = `${environment.apiUrl}/transfers`;

  const transfer: Transfer = {
    id: 5,
    dataTransfer: '2026-09-20',
    horaTransfer: '14:30:00',
    origem: 'Aeroporto',
    destino: 'Hotel',
    status: 'AGUARDANDO_OS',
    valorBase: 550,
    valorOriginal: 100,
    moedaOrigem: 'USD',
    osId: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TransferService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar manda a paginacao e devolve o envelope paginado', () => {
    let recebido: Pagina<Transfer> | undefined;

    service.listar({ page: 1, size: 20, sort: 'dataTransfer,desc' }).subscribe(pagina => (recebido = pagina));

    const req = http.expectOne(r => r.url === base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('sort')).toBe('dataTransfer,desc');

    const resposta: Pagina<Transfer> = {
      conteudo: [transfer], pagina: 1, tamanho: 20, totalElementos: 21, totalPaginas: 2, primeira: false, ultima: true,
    };
    req.flush(resposta);

    expect(recebido?.conteudo.length).toBe(1);
    expect(recebido?.totalElementos).toBe(21);
  });

  it('buscarPorStatus usa /buscar com o status como filtro', () => {
    service.buscarPorStatus('CONFIRMADO', { page: 0, size: 5 }).subscribe();

    const req = http.expectOne(r => r.url === `${base}/buscar`);
    expect(req.request.params.get('status')).toBe('CONFIRMADO');
    expect(req.request.params.get('size')).toBe('5');
    req.flush({ conteudo: [], pagina: 0, tamanho: 5, totalElementos: 0, totalPaginas: 0, primeira: true, ultima: true });
  });

  it('criar e excluir usam POST e DELETE nas urls certas', () => {
    const { id, ...dados } = transfer;

    service.criar(dados).subscribe();
    const criar = http.expectOne(base);
    expect(criar.request.method).toBe('POST');
    expect(criar.request.body).toEqual(dados);
    criar.flush(transfer);

    service.excluir(id).subscribe();
    const excluir = http.expectOne(`${base}/5`);
    expect(excluir.request.method).toBe('DELETE');
    excluir.flush(null);
  });

  it('vincular a uma os reenvia o transfer inteiro mantendo o valorBase', () => {
    service.alterarOrdemServico(transfer, 9).subscribe();

    const req = http.expectOne(`${base}/5`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.osId).toBe(9);
    expect(req.request.body.valorBase).toBe(550);
    expect(req.request.body.moedaOrigem).toBe('USD');
    expect(req.request.body.id).toBeUndefined();
    req.flush({ ...transfer, osId: 9 });
  });
});
