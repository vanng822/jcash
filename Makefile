NODE=node

TEST_FILES=baseurl.js filename.js path.js run.js writeerror.js image.js


test:
	 $(foreach F, ${TEST_FILES},$(NODE) tests/$(F);)

clean cleandir:
	rm tests/data/css/dist/*.*
	rm tests/data/img/dist/*.*
	rm tests/data/js/dist/*.*
	
.PHONY: test
