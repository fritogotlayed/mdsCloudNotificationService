const { logger } = require('../globals');

const exitHandler = (options, exitCode) => {
  if (options.cleanup) logger.trace('cleanup');
  if (options.exitCode || exitCode === 0) logger.trace(`ExitCode: ${exitCode}`);
  if (options.exit) {
    Promise.resolve(logger.info('Shutting down.'))
      .then(() => {
        const ret = options.onShutdown();
        if (ret && ret.then) return ret;
        return Promise.resolve();
      })
      .then(() => process.exit());
  }
};

const wire = (onShutdown) => {
  // do something when app is closing
  process.on('exit', exitHandler.bind(null, { cleanup: true }));

  // catches ctrl+c event
  process.on('SIGINT', exitHandler.bind(null, { exit: true, onShutdown }));

  // catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', exitHandler.bind(null, { exit: true, onShutdown }));
  process.on('SIGUSR2', exitHandler.bind(null, { exit: true, onShutdown }));

  // catches uncaught exceptions
  process.on('uncaughtException', (ex) => {
    logger.error({ err: ex }, 'Unhandled Exception');
    exitHandler.bind(null, { exit: true, onShutdown });
  });
};

module.exports = {
  wire,
};