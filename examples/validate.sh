#!/bin/bash
xmllint --valid --noout --schema wsdl.xsd *.wsdl 2>&1 | perl -0777 -pe 's/[^\n]+no DTD found !\n[^\n]+\n[^\n]+\n//sg'
