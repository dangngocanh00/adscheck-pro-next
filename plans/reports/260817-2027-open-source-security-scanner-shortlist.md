---
title: Open-source security scanner shortlist
date: 2026-08-17T20:27:00+07:00
status: complete
scope: Authorized web applications and source repositories
---

# Open-source security scanner shortlist

## Summary

No single scanner covers a web application completely. Recommended minimum stack:

- URL only: OWASP ZAP + Nuclei + testssl.sh.
- Source available: add Trivy + Semgrep + Gitleaks; use OSV-Scanner when dependency reachability matters.
- Central orchestration: secureCodeBox for Kubernetes teams.
- Central findings management: DefectDojo; it aggregates results but is not a scanner.

All repositories below were public, unarchived, and recently updated when checked on 2026-08-17.

## Findings

| Repository | Layer | Best use | Main limitation |
|---|---|---|---|
| [zaproxy/zaproxy](https://github.com/zaproxy/zaproxy) | DAST | Crawl and test a running web app, authenticated scan support, CI baseline/full scans | Active scan can change state and create load; requires authorization and tuning |
| [projectdiscovery/nuclei](https://github.com/projectdiscovery/nuclei) | Template-based exposure/CVE checks | Fast checks for known exposures across HTTP, API, DNS, network and cloud | Template quality varies; false positives require validation |
| [testssl/testssl.sh](https://github.com/testssl/testssl.sh) | TLS | Protocols, ciphers, certificate and TLS hardening checks | TLS only |
| [aquasecurity/trivy](https://github.com/aquasecurity/trivy) | SCA, secrets, config, containers | One practical CI scanner for dependencies, images, IaC, misconfiguration and SBOM | Does not replace web DAST or deep business-logic review |
| [semgrep/semgrep](https://github.com/semgrep/semgrep) | SAST | Source-code patterns and custom organization rules | Coverage depends on language and rule set |
| [gitleaks/gitleaks](https://github.com/gitleaks/gitleaks) | Secret scanning | Current tree and Git history secret detection | Cannot prove a detected secret remains valid |
| [google/osv-scanner](https://github.com/google/osv-scanner) | Dependency vulnerabilities | OSV-backed package vulnerability and reachability analysis | Does not test a deployed web application |
| [secureCodeBox/secureCodeBox](https://github.com/secureCodeBox/secureCodeBox) | Scanner orchestration | Scheduled multi-scanner pipelines on Kubernetes | Heavy for one site or a small team |
| [DefectDojo/django-DefectDojo](https://github.com/DefectDojo/django-DefectDojo) | Vulnerability management | Import, deduplicate, triage and report findings from multiple scanners | Aggregator, not a replacement for scanners |

## Recommendation

1. Start with passive/baseline ZAP, Nuclei templates tagged for non-intrusive checks, and testssl.sh against systems you own or are authorized to test.
2. Run Trivy, Semgrep and Gitleaks on every pull request when source is available.
3. Validate every High/Critical finding manually before reporting it as exploitable.
4. Add authenticated DAST only with a test account, test environment, rate limits and a rollback plan.
5. Add secureCodeBox only after the individual scanners are stable; use DefectDojo when result volume needs centralized triage.

## Unresolved questions

- Is the target owned by the requester or covered by written testing authorization?
- Is source code available, or only the public URL?
- Is there a staging environment and disposable test account for authenticated DAST?
