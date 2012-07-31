NODE=node

#TEST_FILES=baseurl.js filename.js path.js run.js writeerror.js image.js imagebaseurl.js

TEST_FILES=$(shell find tests/*.js)

test:
	 $(foreach F, ${TEST_FILES},$(NODE) $(F);)


clean cleandir:
	rm tests/data/css/dist/*.*
	rm tests/data/img/dist/*.*
	rm tests/data/js/dist/*.*
	
.PHONY: test
