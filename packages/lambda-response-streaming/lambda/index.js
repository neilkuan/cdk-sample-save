exports.handler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {


      responseStream.write('👻'.repeat(500));
      // await new Promise(r => setTimeout(r, 500));
      responseStream.end();
  },
);