#!/bin/bash
/opt/ort/bin/ort analyze --input-dir /home/ort --output-dir /home/ort/results
/opt/ort/bin/ort scan -i /home/ort/results/analyzer-result.yml -o /home/ort/results
#/opt/ort/bin/ort advise -a OSV --analyzer-result /home/ort/results/analyzer-result.yml --output-dir /home/ort/results
/opt/ort/bin/ort evaluate -i /home/ort/results/scan-result.yml -o /home/ort/results
/opt/ort/bin/ort report -f WebApp -i /home/ort/results/scan-result.yml -o /home/ort/results
