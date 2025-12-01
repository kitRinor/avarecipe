# makefile
.DEFAULT_GOAL := help
.PHONY : help
help:   # show this list
	@echo "---- list of available commands ---"
	@grep -E '^[[:alnum:]_/-]+ *:.*?#.*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?# "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
# ----

.PHONY : up
up:   # run the application
	@echo "Running the application..."
	@pnpm run dev
	
.PHONY : sb/up sb/down sb/reset
sb/up:   # start the local db,s3 (using Docker)
	@echo "Starting the local supabase..."
	@npx supabase start
sb/down:   # stop the local db,s3 (using Docker)
	@echo "Stopping the local supabase..."
	@npx supabase stop
sb/reset:  # reset supabase-data and recreates S3 with empty bucket, and DB without any tables and seed data. 
	@echo "Resetting the local supabase..."
	@npx supabase db reset
	@echo "completed. You may need to run 'make db-push' and 'make db-seed' to recreate the schema and seed data."

.PHONY : db/push db/seed db/dummy
db/push:   # push the database schema to the database
	@echo "Pushing the database schema..."
	@pnpm --filter @repo/api run db:push
db/seed:	 # delete existing rows and seed the database with initial data
	@echo "Seeding the database..."
	@pnpm --filter @repo/api run db:seed
db/dummy:	 # add dummy data for testing
	@echo "Generating dummy data..."
	@pnpm --filter @repo/api run db:dummy
	