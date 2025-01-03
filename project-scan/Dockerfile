FROM ghcr.io/oss-review-toolkit/ort-minimal:44.0.0

WORKDIR $HOME
RUN mkdir -p "$HOME/.ort/config" && git clone https://github.com/senthanal/ort-config.git "$HOME/.ort/config"
COPY --chmod=0755 --chown=ort entrypoint.sh .
COPY --chown=ort package.json .
RUN sed -i -e 's/\r$//' ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
