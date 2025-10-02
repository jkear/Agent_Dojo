# MAJOR APP UPDATE

We need to update the entire app to use composio's system. This app will essentially be a composio/langchain GUI. We should be using Every tool available to offer a user friendly GUI for these platforms.

---

title: Tool Type Generator
image:
  type: url
  value: '<https://og.composio.dev/api/og?title=Tool%20Type%20Generator>'
description: >-
  An example that show you how to showcase auth scheme and action params for
  tools
keywords: 'tool type generator, composio, sdk, tool calling'
subtitle: using raw tool definition to build your own platform on top of Composio
hide-nav-links: true

---

This is a bit of a checky tutorial as it is dogfooding the `docs` tool generation process.

To motivate this example clearly, in our tools section — we have details about let's say [`Github`](/tools/github) tool, that shows its auth scheme, actions and their params.

Now why would anyone outside of Composio want to do this? Well if you are building a platform on top of Composio, perchance a Workflow builder like langflow. You would want to show some or all of this information to your users.

This is a non standard use case, that we support and love users building on top of us but if this is uninteresting to you, you can skip this tutorial.

## How does one build a tool type generator?

In composio, we have two internal states for tools

1. Raw tool definition
2. Provider tool definition

The raw tool definition is an generic input output schema definition that we internally for tools, we expose it for customers if they want to build on top of it but it is not the primary way tools are normally used.

The provider tool definition, translates this raw tool definition to the specific schema of a provider (by default `openai`).

For building something like this, we need to use the raw tool definition.

## Getting the raw tool definition

Of course, you need to initiate the `Composio` sdk first and use a `COMPOSIO_API_KEY` environment variable.

```python Python {2} title="tool_doc_generator/main.py" maxLines=40 wordWrap

        if "properties" in params:
            properties = params.get("properties", {})
```

Let us see an example output for a raw `GMAIL` toolkit, with all of its tools.

this is just a taste but you can see the full output [here](https://github.com/composio-dev/composio/blob/next/fern/pages/src/examples/tool-generator/output.json).

```json JSON title="output.json" maxLines=40
[
    {
        "deprecated": {
            "available_versions": [
                "0_1",
                "latest",
                "latest:base"
            ],
            "display_name": "Modify email labels",
            "is_deprecated": false,
            "toolkit": {
                "logo": "https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/gmail.svg"
            },
            "version": "0_1",
            "displayName": "Modify email labels"
        },
        "description": "Adds and/or removes specified gmail labels for a message; ensure `message id` and all `label ids` are valid (use 'listlabels' for custom label ids).",
        "input_parameters": {
            "properties": {
                "add_label_ids": {
                    "default": [],
                    "description": "Label IDs to add. For custom labels, obtain IDs via 'listLabels'. System labels (e.g., 'INBOX', 'SPAM') can also be used.",
                    "examples": [
                        "STARRED",
                        "IMPORTANT",
                        "Label_123"
                    ],
                    "items": {
                        "type": "string"
                    },
                    "title": "Add Label Ids",
                    "type": "array"
                },
                "message_id": {
                    "description": "Immutable ID of the message to modify (e.g., from 'fetchEmails' or 'fetchMessagesByThreadId').",
                    "examples": [
                        "17f1b2b9c1b2a3d4"
                    ],
                    "title": "Message Id",
                    "type": "string"
                },
                "remove_label_ids": {
                    "default": [],
                    "description": "Label IDs to remove. For custom labels, obtain IDs via 'listLabels'. System labels can also be used.",
                    "examples": [
                        "UNREAD",
                        "Label_456"
                    ],
                    "items": {
                        "type": "string"
                    },
                    "title": "Remove Label Ids",
                    "type": "array"
                },
                "user_id": {
                    "default": "me",
                    "description": "User's email address or 'me' for the authenticated user.",
                    "examples": [
                        "me",
                        "user@example.com"
                    ],
                    "title": "User Id",
                    "type": "string"
                }
            },
            "required": [
                "message_id"
            ],
            "title": "AddLabelToEmailRequest",
            "type": "object"
        },
        "name": "Modify email labels",
        "no_auth": false,
        "output_parameters": {
            "properties": {
                "data": {
                    "description": "Data from the action execution",
                    "properties": {
                        "response_data": {
                            "description": "Full `Message` resource with updated labels.",
                            "title": "Response Data",
                            "type": "object"
                        }
                    },
                    "required": [
                        "response_data"
                    ],
                    "title": "Data",
                    "type": "object"
                },
                "error": {
                    "anyOf": [
                        {
                            "type": "string"
                        },
                        {
                            "type": "null"
                        }
                    ],
                    "default": null,
```

```sh
jq '.[0] | keys' pages/src/examples/tool-generator/output.json
[
  "available_versions",
  "deprecated",
  "description",
  "input_parameters",
  "name",
  "no_auth",
  "output_parameters",
  "scopes",
  "slug",
  "tags",
  "toolkit",
  "version"
]
```

There is a bunch of useful information here, around the `input_parameters` and `output_parameters` for this example but `scopes` is very valuable to know what permissions are required for this tool.

Now from these `input_parameters` and `output_parameters` you can showcase the tool definitions.

```python Python title="tool_doc_generator/main.py" maxLines=40
        fields = []
        _, field_config = field

        for field_list, required in [
            (getattr(field_config, "required", []), True),
            (getattr(field_config, "optional", []), False),
        ]:
            for f in field_list:
                if hasattr(f, "name"):
                    fields.append(self._create_param_from_field(f, required))
```

There is a bunch of other processing things happening here that are super generally relevant, so not going to call them out here that said there is another thing i want to showcase

## Toolkit Information

Toolkis are what we call apps or integrations, for us they are a collection of tools. `GMAIL` has `GMAIL_SEND_EMAIL` as a tool.

Now for building something out like this, you might also want information about the toolkit itself.

A toolkit has information like `categories` or `auth_schemes`

```python Python title="tool_doc_generator/main.py" maxLines=40
            properties = params.get("properties", {})
            required = params.get("required", [])

            for name, schema in properties.items():
```

`auth_schemes` here are `OAUTH2`, `API_KEY` or `BASIC_AUTH`, etc — essentially the types of how one could authenticate with the toolkit.

```python Python title="tool_doc_generator/main.py" maxLines=40
                        default=schema.get("default", ""),
                        required=name in required,
                    )
                )
        else:
            for name, schema in params.items():
                if isinstance(schema, dict):
                    param_list.append(
                        MDX.as_param(
                            name=name,
```

Here is a way to parse the `auth_scheme` data

these are `tuple` objects as they have different schema for specific conditions like `auth_config_creation` or `connected_account_initiation`

they also have `required` and `optional` fields.

the context here is there are some fields you need while creating an auth config and some you need while connecting an account. this separation is done by the `tuple` here

```python Python title="tool_doc_generator/main.py" maxLines=40
        auth_schemes: t.Optional[t.List[toolkit_retrieve_response.AuthConfigDetail]] = None,
    ) -> None:
        schemes = ", ".join(
            self._get_auth_type(s) for s in (auth_schemes or []) if self._extract_auth_fields(s)
        )
        self._blocks.extend(
            [
                f"""## Connecting to {app_name}
### Create an auth config
Use the dashboard to create an auth config for the {app_name} toolkit. This allows you to connect multiple {app_name} accounts to Composio for agents to use.

<Steps>
  <Step title="Select App">
    Navigate to **[{app_name}](https://platform.composio.dev?next_page=/marketplace/{app_name})**.
  </Step>
  <Step title="Configure Auth Config Settings">
    Select among the supported auth schemes of and configure them here.
  </Step>
  <Step title="Create and Get auth config ID">
    Click **"Create {app_name} Auth Config"**. After creation, **copy the displayed ID starting with `ac_`**. This is your auth config ID. This is _not_ a sensitive ID -- you can save it in environment variables or a database.
    **This ID will be used to create connections to the toolkit for a given user.**
  </Step>
</Steps>
"""
            ],
        )

        # Add auth code snippets
        self._add_auth_section(app_name, app_slug, auth_schemes)

    def _add_auth_section(
        self,
        app_name: str,
        app_slug: str,
        auth_schemes: t.List[toolkit_retrieve_response.AuthConfigDetail] = None,
    ) -> None:
        """Add code snippets for each auth scheme using direct template processing"""
        if not auth_schemes:
            return
        
        self._blocks.append("### Connect Your Account")
        
        # Group auth schemes by type to avoid duplicates
        seen_auth_types = set()
        
```

This is a fairly minimal explanation for the amount of code, as most of it is not super related to composio but it will be a good example on seeing behind the scenes of how composio is working and how to leverage the platform further.

---

title: Basic FastAPI Server
subtitle: Build a simple Gmail agent with Composio and FastAPI
image:
  type: url
  value: '<https://og.composio.dev/api/og?title=Basic%20FastAPI%20Server>'
keywords: 'fastapi, composio, openai, gmail, agent'
hide-nav-links: false

---

This cookbook will guide you through building agents equipped with tools using `Composio`, `OpenAI`, and `FastAPI`.

## Prerequisites

* Python 3.10+
* [UV](https://docs.astral.sh/uv/getting-started/installation/)
* Composio API key
* OpenAI API key

## Building an AI agent that can interact with `gmail` service

First, let's start with building a simple AI agent with Composio tools that lets the agent interact with `gmail`.

```python
from openai import OpenAI
from composio import Composio
from composio_openai import OpenAIProvider
import os

def run_gmail_agent(
    composio_client: Composio[OpenAIProvider],
    openai_client: OpenAI,
    user_id: str,  # Composio uses the User ID to store and access user-level authentication tokens.
    prompt: str,
):
    """
    Run the Gmail agent using composio and openai clients.
    """
    # Step 1: Fetch the necessary Gmail tools list with Composio
    tools = composio_client.tools.get(
        user_id=user_id,
        tools=[
            "GMAIL_FETCH_EMAILS",
            "GMAIL_SEND_EMAIL",
            "GMAIL_CREATE_EMAIL_DRAFT"
        ]
    )

    # Step 2: Use OpenAI to generate a response based on the prompt and available tools
    response = openai_client.chat.completions.create(
        model="gpt-4.1",
        tools=tools,
        messages=[{"role": "user", "content": prompt}],
    )

    # Step 3: Handle tool calls with Composio and return the result
    result = composio_client.provider.handle_tool_calls(response=response, user_id=user_id)
    return result
```

<Note>
This example demonstrates a basic agent without state management or agentic loops,
suitable for simple one-step tasks. For complex multi-step workflows requiring
memory and iterative reasoning, see our cookbooks with frameworks like LangChain,
CrewAI, or AutoGen.
</Note>

To invoke this agent, authenticate your users with Composio's managed authentication service.

## Authenticating users

To authenticate your users with Composio you need an authentication config for the given app. In this case you need one for gmail.

To create an authentication config for `gmail` you need `client_id` and `client_secret` from your [Google OAuth Console](https://developers.google.com/identity/protocols/oauth2). Once you have the credentials, use the following piece of code to set up authentication for `gmail`.

```python
from composio import Composio
from composio_openai import OpenAIProvider

def create_auth_config(composio_client: Composio[OpenAIProvider]):
    """
    Create a auth config for the gmail toolkit.
    """
    client_id = os.getenv("GMAIL_CLIENT_ID")
    client_secret = os.getenv("GMAIL_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise ValueError("GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET must be set")

    return composio_client.auth_configs.create(
        toolkit="GMAIL",
        options={
            "name": "default_gmail_auth_config",
            "type": "use_custom_auth",
            "auth_scheme": "OAUTH2",
            "credentials": {
                "client_id": client_id,
                "client_secret": client_secret,
            },
        },
    )
```

This will create a Gmail authentication config to authenticate your app’s users. Ideally, create one authentication object per project, so check for an existing auth config before creating a new one.

```python
def fetch_auth_config(composio_client: Composio[OpenAIProvider]):
    """
    Fetch the auth config for a given user id.
    """
    auth_configs = composio_client.auth_configs.list()
    for auth_config in auth_configs.items:
        if auth_config.toolkit == "GMAIL":
            return auth_config

    return None
```

<Note>
Composio platform provides composio managed authentication for some apps to
fast-track your development, `gmail` being one of them. You can use these
default auth configs for development, but for production, always use your
own oauth app configuration.
</Note>

Once you have authentication management in place, we can start with connecting your users to your `gmail` app. Let's implement a function to connect users to your `gmail` app via composio.

```python
from fastapi import FastAPI

# Function to initiate a connected account
def create_connection(composio_client: Composio[OpenAIProvider], user_id: str):
    """
    Create a connection for a given user id and auth config id.
    """
    # Fetch or create the auth config for the gmail toolkit
    auth_config = fetch_auth_config(composio_client=composio_client)
    if not auth_config:
        auth_config = create_auth_config(composio_client=composio_client)

    # Create a connection for the user
    return composio_client.connected_accounts.initiate(
        user_id=user_id,
        auth_config_id=auth_config.id,
    )

# Setup FastAPI
app = FastAPI()

# Connection initiation endpoint
@app.post("/connection/create")
def _create_connection(
    request: CreateConnectionRequest,
    composio_client: ComposioClient,
) -> dict:
    """
    Create a connection for a given user id.
    """
    # For demonstration, using a default user_id. Replace with real user logic in production.
    user_id = "default"

    # Create a new connection for the user
    connection_request = create_connection(composio_client=composio_client, user_id=user_id)
    return {
        "connection_id": connection_request.id,
        "redirect_url": connection_request.redirect_url,
    }
```

Now, you can make a request to this endpoint on your client app, and your user will get a URL which they can use to authenticate.

## Set Up FastAPI service

We will use [`FastApi`](https://fastapi.tiangolo.com/) to build an HTTP service that authenticates your users and lets them interact with your agent. This guide will provide best practices for using composio client in production environments.

### Setup dependencies

FastAPI allows [dependency injection](https://fastapi.tiangolo.com/reference/dependencies/) to simplify the usage of SDK clients that must be singletons. We recommend using composio SDK client as singleton.

```python
import os
import typing_extensions as te

from composio import Composio
from composio_openai import OpenAIProvider

from fastapi import Depends

_composio_client: Composio[OpenAIProvider] | None = None

def provide_composio_client():
    """
    Provide a Composio client.
    """
    global _composio_client
    if _composio_client is None:
        _composio_client = Composio(provider=OpenAIProvider())
    return _composio_client


ComposioClient = te.Annotated[Composio, Depends(provide_composio_client)]
"""
A Composio client dependency.
"""
```

Check [dependencies](./simple_gmail_agent/server/dependencies.py) module for more details.

### Invoke agent via FastAPI

When invoking an agent, make sure you validate the `user_id`.

```python
def check_connected_account_exists(
    composio_client: Composio[OpenAIProvider],
    user_id: str,
):
    """
    Check if a connected account exists for a given user id.
    """
    # Fetch all connected accounts for the user
    connected_accounts = composio_client.connected_accounts.list(
        user_ids=[user_id],
        toolkit_slugs=["GMAIL"],
    )

    # Check if there's an active connected account
    for account in connected_accounts.items:
        if account.status == "ACTIVE":
            return True

        # Ideally you should not have inactive accounts, but if you do, delete them.
        print(f"[warning] inactive account {account.id} found for user id: {user_id}")
    return False

def validate_user_id(user_id: str, composio_client: ComposioClient):
    """
    Validate the user id, if no connected account is found, create a new connection.
    """
    if check_connected_account_exists(composio_client=composio_client, user_id=user_id):
        return user_id

    raise HTTPException(
        status_code=404, detail={"error": "No connected account found for the user id"}
    )

# Endpoint: Run the Gmail agent for a given user id and prompt
@app.post("/agent")
def _run_gmail_agent(
    request: RunGmailAgentRequest,
    composio_client: ComposioClient,
    openai_client: OpenAIClient,  # OpenAI client will be injected as dependency
) -> List[ToolExecutionResponse]:
    """
    Run the Gmail agent for a given user id and prompt.
    """
    # For demonstration, using a default user_id. Replace with real user logic in production.
    user_id = "default"

    # Validate the user id before proceeding
    user_id = validate_user_id(user_id=user_id, composio_client=composio_client)

    # Run the Gmail agent using Composio and OpenAI
    result = run_gmail_agent(
        composio_client=composio_client,
        openai_client=openai_client,
        user_id=user_id,
        prompt=request.prompt,
    )
    return result
```

<Note>
Check [server](./simple_gmail_agent/server/) module for service implementation
</Note>

## Putting everything together

So far, we have created an agent with ability to interact with `gmail` using the `composio` SDK, functions to manage connected accounts for users and a FastAPI service. Now let's run the service.

<Note>
Before proceeding, check the [code](./simple_gmail_agent/server/api.py) for utility endpoints not discussed in the cookbook
</Note>

1. Clone the repository

   ```bash
   git clone git@github.com:composiohq/composio-fastapi
   cd composio-fastapi/
   ```

2. Setup environment

   ```bash
   cp .env.example .env
   ```

   Fill the api keys

   ```dotenv
   COMPOSIO_API_KEY=
   OPENAI_API_KEY=
   ```

   Create the virtual env

   ```bash
   make env
   source .venv/bin/activate
   ```

3. Run the HTTP server

   ```bash
   uvicorn simple_gmail_agent.server.api:create_app --factory
   ```

## Testing the API with curl

Assuming the server is running locally on `http://localhost:8000`.

### Check if a connection exists

```bash
curl -X POST http://localhost:8000/connection/exists
```

### Create a connection

Note: The body fields are required by the API schema, but are ignored internally in this example service.

```bash
curl -X POST http://localhost:8000/connection/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "default",
    "auth_config_id": "AUTH_CONFIG_ID_FOR_GMAIL_FROM_THE_COMPOSIO_DASHBOARD"
  }'
```

Response includes `connection_id` and `redirect_url`. Complete the OAuth flow at the `redirect_url`.

### Check connection status

Use the `connection_id` returned from the create step.

```bash
curl -X POST http://localhost:8000/connection/status \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "default",
    "connection_id": "CONNECTION_ID_FROM_CREATE_RESPONSE"
  }'
```

### Run the Gmail agent

Requires an active connected account for the `default` user.

```bash
curl -X POST http://localhost:8000/agent \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "default",
    "prompt": "Summarize my latest unread emails from the last 24 hours."
  }'
```

### Fetch emails (direct action)

```bash
curl -X POST http://localhost:8000/actions/fetch_emails \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "default",
    "limit": 5
  }'
```

These examples are intended solely for testing purposes.

## Using Composio for managed auth and tools

Composio reduces boilerplate for building AI agents that access and use various apps. In this cookbook, to build Gmail integration without Composio, you would have to write code to

* manage Gmail OAuth app
* manage user connections
* tools for your agents to interact with Gmail

Using Composio simplifies all of the above to a few lines of code as shown in the cookbook.

## Best practices

**🎯 Effective Prompts**:

* Be specific: "Send email to <john@company.com> about tomorrow's 2pm meeting" works better than "send email"
* Include context: "Reply to Sarah's email about the budget with our approval"
* Use natural language: The agent understands conversational requests

**🔒 User Management**:

* Use unique, consistent `user_id` values for each person
* Each user maintains their own Gmail connection
* User IDs can be email addresses, usernames, or any unique identifier

## Troubleshooting

**Connection Issues**:

* Ensure your `.env` file has valid `COMPOSIO_API_KEY` and `OPENAI_API_KEY`
* Check if the user has completed Gmail authorization.
* Verify the user_id matches exactly between requests

**API Errors**:

* Check the server logs for detailed error messages
* Ensure request payloads match the expected format
* Visit `/docs` endpoint for API schema validation

**Gmail API Limits**:

* Gmail has rate limits; the agent will handle these gracefully
* For high-volume usage, consider implementing request queuing

---

title: LangChain Provider
slug: /providers/langchain
image:
  type: url
  value: '<https://og.composio.dev/api/og?title=LangChain%20Provider>'
keywords: ''
hide-nav-links: false
---

The LangChain Provider transforms Composio tools into a format compatible with LangChain's function calling capabilities.

## Setup

<CodeGroup>
```bash title="Python" for="python"
pip install composio_langchain==0.8.0 langchain
```
```bash title="TypeScript" for="typescript"
npm install @composio/langchain
```
</CodeGroup>

## Usage

<CodeGroup>
```python Python title="Python" maxLines=40
from composio import Composio
from composio_langchain import LangchainProvider
from langchain import hub  # type: ignore
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_openai import ChatOpenAI

# Pull relevant agent model

prompt = hub.pull("hwchase17/openai-functions-agent")

# Initialize tools

openai_client = ChatOpenAI(model="gpt-5")

composio = Composio(provider=LangchainProvider())

# Get All the tools

tools = composio.tools.get(user_id="default", toolkits=["GITHUB"])

# Define task

task = "Star a repo composiohq/composio on GitHub"

# Define agent

agent = create_openai_functions_agent(openai_client, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# Execute using agent_executor

agent_executor.invoke({"input": task})

```
```typescript TypeScript title="TypeScript" maxLines=40 
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { StateGraph, MessagesAnnotation } from '@langchain/langgraph';
import { Composio } from '@composio/core';
import { LangchainProvider } from '@composio/langchain';
// initiate composio
const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new LangchainProvider(),
});

// fetch the tool
console.log(`🔄 Fetching the tool...`);
const tools = await composio.tools.get('default', 'HACKERNEWS_GET_USER');

// Define the tools for the agent to use
const toolNode = new ToolNode(tools);

// Create a model and give it access to the tools
const model = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0,
}).bindTools(tools);

// Define the function that determines whether to continue or not
function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.tool_calls?.length) {
    return 'tools';
  }
  // Otherwise, we stop (reply to the user) using the special "__end__" node
  return '__end__';
}

// Define the function that calls the model
async function callModel(state: typeof MessagesAnnotation.State) {
  console.log(`🔄 Calling the model...`);
  const response = await model.invoke(state.messages);

  // We return a list, because this will get added to the existing list
  return { messages: [response] };
}

// Define a new graph
const workflow = new StateGraph(MessagesAnnotation)
  .addNode('agent', callModel)
  .addEdge('__start__', 'agent') // __start__ is a special name for the entrypoint
  .addNode('tools', toolNode)
  .addEdge('tools', 'agent')
  .addConditionalEdges('agent', shouldContinue);

// Finally, we compile it into a LangChain Runnable.
const app = workflow.compile();

// Use the agent
const finalState = await app.invoke({
  messages: [new HumanMessage('Find the details of the user `pg` on HackerNews')],
});
console.log(`✅ Message recieved from the model`);
console.log(finalState.messages[finalState.messages.length - 1].content);

const nextState = await app.invoke({
  // Including the messages from the previous run gives the LLM context.
  // This way it knows we're asking about the weather in NY
  messages: [...finalState.messages, new HumanMessage('what about haxzie')],
});
console.log(`✅ Message recieved from the model`);
console.log(nextState.messages[nextState.messages.length - 1].content);

```

</CodeGroup>
