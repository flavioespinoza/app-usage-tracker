# Step 1

Now that we have a function, we'll take it a little further.

**IMPORTANT**: Don't write any code yet. We want to brainstorm about how this would work.

## Step 1 Goals:

- Add a unique property `id` or `_id` assigned by MongoDB Atlas using Mongoose for type control.
- Add a `commit` property which is the commit hash assigned by Git.
- Find out if multiple active sessions share the same commit hash.
- If so, we will proceed to step 2.
- I would prefer to keep this in JavaScript, but we're going to have to access GitHub, so git log may be a good option.

**NOTICE**: `id: 1` and `id: 2` have the same commit hash `68cbab9e66bb67c8b0df00b2624a71a462ea0d92`. It may be the case where multiple active sessions share the same commit hash.



This is the desired result of `active_usage_step_1.json`:

```json
[
    {
        "id": 1,
        "commit": "68cbab9e66bb67c8b0df00b2624a71a462ea0d92",
        "sessionStart": "2025-03-14T01:46:55.522Z",
        "sessionEnd": "2025-03-14T01:50:31.667Z",
        "durationHours": "0.06"
    },
    {
        "id": 2,
        "commit": "68cbab9e66bb67c8b0df00b2624a71a462ea0d92",
        "sessionStart": "2025-03-14T01:50:31.667Z",
        "sessionEnd": "2025-03-14T01:53:13.334Z",
        "durationHours": "0.04"
    },
    {
        "id": 3,
        "commit": "2613dee80ca85f449fcc7ad599aa8b62778828d9",
        "sessionStart": "2025-03-14T01:53:13.334Z",
        "sessionEnd": "2025-03-14T01:54:42.464Z",
        "durationHours": "0.02"
    }
]

**IMPORTANT**: don't write any code yet. i want to brainstorm about how this would work.

one idea is to create a function that takes in an github author or username and pull their commits based on the start_date and end_date provided.

**Usage**: yarn track MM/DD/YYYY MM/DD/YYYY --author $AUTHOR_NAME

```shell
yarn track 02/17/2025 03/16/2025 --author Flavio Espinoza                                                      
```

**IMPORTANT**: don't write any code yet. i want to brainstorm about how this would work.

your turn to ask questions.


