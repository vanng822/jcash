NODE = node

TEST_FILES=$(shell find tests/*.js)


test:
	 $(foreach F, ${TEST_FILES},$(NODE) $(F);)

.PHONY: test
