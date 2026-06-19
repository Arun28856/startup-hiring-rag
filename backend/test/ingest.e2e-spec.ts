import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosHeaders, AxiosResponse } from 'axios';
import { AppModule } from '../src/app.module';

describe('Ingest (e2e)', () => {
  let app: INestApplication;
  let httpService: HttpService;

  const mockAxiosResponse = <T>(data: T): AxiosResponse<T> => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {
      headers: new AxiosHeaders(),
    },
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );

    await app.init();

    httpService = app.get(HttpService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /ingest with valid body returns 201', async () => {
    jest.spyOn(httpService, 'post').mockReturnValue(
      of(mockAxiosResponse({ chunks_stored: 3 })),
    );

    const response = await request(app.getHttpServer())
      .post('/ingest')
      .send({
        filename: 'test.md',
        content: '# Engineering\n\n## Backend\n\nSalary: 15-25 LPA',
        mimeType: 'text/markdown',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      message: 'Ingested successfully',
      chunksStored: 3,
    });
  });

  it('POST /ingest with missing filename returns 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/ingest')
      .send({
        content: 'some content',
        mimeType: 'text/plain',
      })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
    expect(Array.isArray(response.body.message)).toBe(true);
  });

  it('POST /ingest with missing content returns 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/ingest')
      .send({
        filename: 'test.txt',
        mimeType: 'text/plain',
      })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
    expect(Array.isArray(response.body.message)).toBe(true);
  });

  it('POST /ingest with invalid mimeType returns 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/ingest')
      .send({
        filename: 'test.html',
        content: '<html>hello</html>',
        mimeType: 'text/html',
      })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
    expect(Array.isArray(response.body.message)).toBe(true);
  });

  it('POST /ingest with empty body returns 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/ingest')
      .send({})
      .expect(400);

    expect(response.body.statusCode).toBe(400);
  });
});
