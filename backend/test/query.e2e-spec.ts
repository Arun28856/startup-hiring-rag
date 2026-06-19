import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosHeaders, AxiosResponse } from 'axios';
import { AppModule } from '../src/app.module';

describe('Query (e2e)', () => {
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

  const mockQueryResponse = {
    answer: 'Backend engineers at Indian startups earn 15-25 LPA.',
    sources: [
      {
        content: '## Backend Engineer\n\nSalary: 15-25 LPA',
        metadata: { role_title: 'Backend Engineer', source: 'startup_data.md' },
      },
    ],
  };

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

  it('POST /query with valid question returns 200', async () => {
    jest.spyOn(httpService, 'post').mockReturnValue(
      of(mockAxiosResponse(mockQueryResponse)),
    );

    const response = await request(app.getHttpServer())
      .post('/query')
      .send({ question: 'What is the salary for a backend engineer?' })
      .expect(200);

    expect(response.body).toMatchObject({
      answer: expect.any(String),
      sources: expect.any(Array),
    });
    expect(response.body.sources[0]).toMatchObject({
      content: expect.any(String),
      metadata: expect.any(Object),
    });
  });

  it('POST /query with empty question string returns 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/query')
      .send({ question: '' })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
    expect(Array.isArray(response.body.message)).toBe(true);
  });

  it('POST /query with question shorter than 3 chars returns 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/query')
      .send({ question: 'hi' })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
    expect(Array.isArray(response.body.message)).toBe(true);
  });

  it('POST /query with missing question returns 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/query')
      .send({})
      .expect(400);

    expect(response.body.statusCode).toBe(400);
  });

  it('POST /query with extra fields returns 400 (forbidNonWhitelisted)', async () => {
    const response = await request(app.getHttpServer())
      .post('/query')
      .send({ question: 'What is backend salary?', extra: 'field' })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
  });
});
