import logging
from truefoundry.deploy import (
    LocalSource,
    Resources,
    Service,
    PythonBuild,
    Build,
    NodeSelector,
    Port,
)

logging.basicConfig(level=logging.INFO)

service = Service(
    name="finsage-server",
    image=Build(
        build_source=LocalSource(),
        build_spec=PythonBuild(
            build_context_path="./",
            command="uvicorn app:app --host 0.0.0.0 --port 8000",
        ),
    ),
    resources=Resources(
        cpu_request=0.5,
        cpu_limit=0.5,
        memory_request=1000,
        memory_limit=1000,
        ephemeral_storage_request=500,
        ephemeral_storage_limit=500,
        node=NodeSelector(capacity_type="spot_fallback_on_demand"),
    ),
    env={"KEY": "VALUE"},
    ports=[
        Port(
            port=8000,
            protocol="TCP",
            expose=True,
            app_protocol="http",
            host="finsage-server-sfhack-8000.ml.odsc-demo.truefoundry.cloud",
        )
    ],
    replicas=1.0,
)


service.deploy(workspace_fqn="odsc-cluster:sfhack", wait=False)
