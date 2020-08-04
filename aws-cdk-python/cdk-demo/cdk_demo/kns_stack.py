from aws_cdk import (
    core,
    aws_iam as iam,
    aws_kinesis as kinesis

)


class KnsStack(core.Construct):
    @property
    def wellness_kns_stream(self):
        return self._wellness_kns_stream

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # The code that defines your stack goes here
        self._wellness_kns_stream = kinesis.Stream(
            self, 'WellnessKnsStream', retention_period=core.Duration.hours(24), shard_count=1, stream_name='event.member.appointment.devInfo')
