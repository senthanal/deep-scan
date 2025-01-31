FROM ghcr.io/oss-review-toolkit/ort-minimal:44.0.0

WORKDIR $HOME
COPY --chmod=0755 --chown=ort . .
COPY --chmod=0755 --chown=ort entrypoint.sh .
RUN sed -i -e 's/\r$//' ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
