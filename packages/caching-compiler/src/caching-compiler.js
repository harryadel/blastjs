import path from 'path';
import LRU from 'lru-native2';
import { CachingCompilerBase } from './base-caching-compiler';

// CachingCompiler is a class designed to be used with Plugin.registerCompiler
// which implements in-memory and on-disk caches for the files that it
// processes.  You should subclass CachingCompiler and define the following
// methods: getCacheKey, compileOneFile, addCompileResult, and
// compileResultSize.
//
// CachingCompiler assumes that files are processed independently of each other;
// there is no 'import' directive allowing one file to reference another.  That
// is, editing one file should only require that file to be rebuilt, not other
// files.
//
// The data that is cached for each file is of a type that is (implicitly)
// defined by your subclass. CachingCompiler refers to this type as
// `CompileResult`, but this isn't a single type: it's up to your subclass to
// decide what type of data this is.  You should document what your subclass's
// CompileResult type is.
//
// Your subclass's compiler should call the superclass compiler specifying the
// compiler name (used to generate environment variables for debugging and
// tweaking in-memory cache size) and the default cache size.
//
// By default, CachingCompiler processes each file in "parallel". That is, if it
// needs to yield to read from the disk cache, or if getCacheKey,
// compileOneFile, or addCompileResult yields, it will start processing the next
// few files. To set how many files can be processed in parallel (including
// setting it to 1 if your subclass doesn't support any parallelism), pass the
// maxParallelism option to the superclass constructor.
//
// For example (using ES2015 via the ecmascript package):
//
//   class AwesomeCompiler extends CachingCompiler {
//     constructor() {
//       super({
//         compilerName: 'awesome',
//         defaultCacheSize: 1024*1024*10,
//       });
//     }
//     // ... define the other methods
//   }
//   Plugin.registerCompile({
//     extensions: ['awesome'],
//   }, () => new AwesomeCompiler());
//
// XXX maybe compileResultSize and stringifyCompileResult should just be methods
// on CompileResult? Sort of hard to do that with parseCompileResult.
export class CachingCompiler extends CachingCompilerBase {
  constructor({
    compilerName,
    defaultCacheSize,
    maxParallelism = 20,
  }) {
    super({ compilerName, defaultCacheSize, maxParallelism });

    // Maps from a hashed cache key to a compileResult.
    this._cache = new LRU({
      max: this._cacheSize,
      length: (value) => this.compileResultSize(value),
    });
  }

  // Your subclass must override this method to define the transformation from
  // InputFile to its cacheable CompileResult).
  //
  // Given an InputFile (the data type passed to processFilesForTarget as part
  // of the Plugin.registerCompiler API), compiles the file and returns a
  // CompileResult (the cacheable data type specific to your subclass).
  //
  // This method is not called on files when a valid cache entry exists in
  // memory or on disk.
  //
  // On a compile error, you should call `inputFile.error` appropriately and
  // return null; this will not be cached.
  //
  // This method should not call `inputFile.addJavaScript` and similar files!
  // That's what addCompileResult is for.
  compileOneFile(inputFile) {
    throw Error('CachingCompiler subclass should implement compileOneFile!');
  }

  // The processFilesForTarget method from the Plugin.registerCompiler API. If
  // you have processing you want to perform at the beginning or end of a
  // processing phase, you may want to override this method and call the
  // superclass implementation from within your method.
  async processFilesForTarget(inputFiles) {
    const cacheMisses = [];
    const arches = this._cacheDebugEnabled && Object.create(null);

    inputFiles.forEach((inputFile) => {
      if (arches) {
        arches[inputFile.getArch()] = 1;
      }

      const getResult = () => {
        const cacheKey = this._deepHash(this.getCacheKey(inputFile));
        let compileResult = this._cache.get(cacheKey);

        if (!compileResult) {
          compileResult = this._readCache(cacheKey);
          if (compileResult) {
            this._cacheDebug(`Loaded ${inputFile.getDisplayPath()}`);
          }
        }

        if (!compileResult) {
          cacheMisses.push(inputFile.getDisplayPath());
          compileResult = Promise.await(this.compileOneFile(inputFile));

          if (!compileResult) {
            // compileOneFile should have called inputFile.error.
            //  We don't cache failures for now.
            return;
          }

          // Save what we've compiled.
          this._cache.set(cacheKey, compileResult);
          this._writeCacheAsync(cacheKey, compileResult);
        }

        return compileResult;
      };

      if (this.compileOneFileLater
        && inputFile.supportsLazyCompilation) {
        this.compileOneFileLater(inputFile, getResult);
      } else {
        const result = getResult();
        if (result) {
          this.addCompileResult(inputFile, result);
        }
      }
    });

    if (this._cacheDebugEnabled) {
      this._afterLinkCallbacks.push(() => {
        cacheMisses.sort();

        this._cacheDebug(
          `Ran (#${++this._callCount
          }) on: ${JSON.stringify(cacheMisses)
          } ${JSON.stringify(Object.keys(arches).sort())
          }`,
        );
      });
    }
  }

  _cacheFilename(cacheKey) {
    // We want cacheKeys to be hex so that they work on any FS and never end in
    // .cache.
    if (!/^[a-f0-9]+$/.test(cacheKey)) {
      throw Error(`bad cacheKey: ${cacheKey}`);
    }
    return path.join(this._diskCache, `${cacheKey}.cache`);
  }

  // Load a cache entry from disk. Returns the compileResult object
  // and loads it into the in-memory cache too.
  _readCache(cacheKey) {
    if (!this._diskCache) {
      return null;
    }
    const cacheFilename = this._cacheFilename(cacheKey);
    const compileResult = this._readAndParseCompileResultOrNull(cacheFilename);
    if (!compileResult) {
      return null;
    }
    this._cache.set(cacheKey, compileResult);
    return compileResult;
  }

  _writeCacheAsync(cacheKey, compileResult) {
    if (!this._diskCache) { return; }
    const cacheFilename = this._cacheFilename(cacheKey);
    const cacheContents = this.stringifyCompileResult(compileResult);
    this._writeFile(cacheFilename, cacheContents);
  }

  // Returns null if the file does not exist or can't be parsed; otherwise
  // returns the parsed compileResult in the file.
  _readAndParseCompileResultOrNull(filename) {
    const raw = this._readFileOrNull(filename);
    return this.parseCompileResult(raw);
  }
}
