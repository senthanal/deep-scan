FROM ghcr.io/oss-review-toolkit/ort-minimal:39.0.0

WORKDIR $HOME
RUN mkdir -p $HOME/.ort/config && git clone https://github.com/senthanal/ort-config.git $HOME/.ort/config
COPY entrypoint.sh $HOME/entrypoint.sh
COPY package.json $HOME/package.json

CMD ["/bin/bash","-c","./entrypoint.sh"]
#ENTRYPOINT ["/bin/echo", "Hello >> /home/ort/results/ort-report.txt"]
