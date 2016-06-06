'use strict';

const tap = require('tap');
const sinon = require('sinon');
const mockRequire = require('mock-require');
require('sinon-as-promised');

process.env.TRELLO_API_KEY = 'trello-api-key';
process.env.TRELLO_API_TOK = 'trello-api-tok';

const sandbox = sinon.sandbox.create();
const createATCCard = sandbox.stub();
const createBPAComponents = sandbox.stub();
mockRequire('../../webhookHandlers/intake/move-to-iaa-go/create-atc-card', createATCCard);
mockRequire('../../webhookHandlers/intake/move-to-iaa-go/create-bpa-components', createBPAComponents);

const moveToiaaGo = require('../../webhookHandlers/intake/move-to-iaa-go');

// Disable logging to the console.
require('@erdc-itl/simple-logger').setOptions({ console: false });

tap.beforeEach(done => {
  sandbox.reset();
  done();
});
tap.teardown(() => {
  sandbox.restore();
  mockRequire.stopAll();
});

tap.test('webhook handlers - intake: move to IAA Go', t1 => {
  t1.test('event is not a card move', t2 => {
    const trelloEvent = {
      action: {
        type: 'Something'
      }
    };
    moveToiaaGo(trelloEvent)
      .then(() => {
        t2.fail('rejects');
      })
      .catch(e => {
        t2.pass('rejects');
        t2.equal(e.message, 'Not a move to IAA Go', 'returns the expected error');
      })
      .then(t2.done);
  });

  t1.test('event is a card move', t2 => {
    t2.test('move is not into IAA Go list', t3 => {
      const trelloEvent = {
        action: {
          type: 'updateCard',
          data: {
            card: {
              id: 'card-id',
              name: 'test card'
            },
            listBefore: {
              name: 'list-before'
            },
            listAfter: {
              name: 'list-after'
            }
          }
        }
      };
      moveToiaaGo(trelloEvent)
        .then(() => {
          t3.fail('rejects');
        })
        .catch(e => {
          t3.pass('rejects');
          t3.equal(e.message, 'Not a move to IAA Go', 'returns the expected error');
        })
        .then(t3.done);
    });

    t2.test('move is into IAA Go list', t3 => {
      const trelloEvent = {
        action: {
          type: 'updateCard',
          data: {
            card: {
              id: 'card-id',
              name: `card-name`
            },
            listBefore: {
              name: 'list-before'
            },
            listAfter: {
              name: 'IAA Go'
            }
          }
        }
      };

      t3.test('createATCCard rejects', t4 => {
        const err = new Error('Test error');
        createATCCard.rejects(err);

        moveToiaaGo(trelloEvent)
          .then(() => {
            t4.fail('rejects');
          })
          .catch(e => {
            t4.pass('rejects');
            t4.equal(e, err, 'returns the expected error');
          })
          .then(t4.done);
      });

      t3.test('createATCCard resolves', t4 => {
        t4.test('createBPAComponents rejects', t5 => {
          const err = new Error('Test error');
          createATCCard.resolves();
          createBPAComponents.rejects(err);

          moveToiaaGo(trelloEvent)
            .then(() => {
              t5.fail('rejects');
            })
            .catch(e => {
              t5.pass('rejects');
              t5.equal(e, err, 'returns the expected error');
            })
            .then(t5.done);
        });

        t4.test('createBPAComponents resolves', t5 => {
          createATCCard.resolves();
          createBPAComponents.resolves();

          moveToiaaGo(trelloEvent)
            .then(() => {
              t5.pass('resolves');
            })
            .catch(() => {
              t5.fail('resolves');
            })
            .then(t5.done);
        });

        t4.done();
      });

      t3.done();
    });

    t2.done();
  });

  t1.done();
});