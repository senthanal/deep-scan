#!/bin/bash
echo "Running ORT analyze task"
/opt/ort/bin/ort analyze -i /home/ort -o /home/ort/results
echo "done"
echo "Running ORT scan task"
/opt/ort/bin/ort scan -i /home/ort/results/analyzer-result.yml -o /home/ort/results
echo "done"
#/opt/ort/bin/ort advise -a OSV --analyzer-result /home/ort/results/analyzer-result.yml --output-dir /home/ort/results
echo "Running ORT evaluate task"
/opt/ort/bin/ort evaluate -i /home/ort/results/scan-result.yml -o /home/ort/results
echo "done"
echo "Running ORT report task"
/opt/ort/bin/ort report -f WebApp,CycloneDx -i /home/ort/results/scan-result.yml -o /home/ort/results
echo "done"
